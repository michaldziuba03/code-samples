import { Writable } from "node:stream";
import { WsOpcode } from "./types";

enum WsState {
  BASE_HEADER,
  EXTENDED_PAYLOAD_LEN_16,
  EXTENDED_PAYLOAD_LEN_64,
  AFTER_PAYLOAD_LEN,
  MASKING_KEY,
  PAYLOAD,
  COMPLETE,
};

export class WsReceiver extends Writable {
  private state: WsState = WsState.BASE_HEADER;
  private loop: boolean = false;

  private fin: boolean = false;
  private mask: boolean = false;
  private opcode: WsOpcode = 0;
  private payloadLen: number = 0;
  private maskingKey: Buffer = Buffer.alloc(0);
  private isBinary: boolean = false;

  private buf: Buffer = Buffer.alloc(0);
  private offset = 0;

  private fragments: Buffer[] = [];

  _write(
    chunk: Buffer,
    encoding: BufferEncoding,
    cb: (error?: Error | null) => void
  ): void {
    this.buf = Buffer.concat([this.buf, chunk]);
    this.loop = true;
    try {
      this.parse();
      cb();
    } catch (err) {
      cb(err as Error);
    }
  }

  private reset() {
    this.fin = false;
    this.mask = false;
    this.opcode = 0;
    this.payloadLen = 0;
    this.maskingKey = Buffer.alloc(0);
    this.isBinary = false;

    this.buf =
      this.remaining() >= 0
        ? this.buf.subarray(this.offset, this.buf.byteLength)
        : Buffer.alloc(0);
    this.offset = 0;

    this.state = WsState.BASE_HEADER;
  }

  private remaining() {
    return this.buf.byteLength - this.offset;
  }

  private isControlFrame() {
    return this.opcode >= WsOpcode.CLOSE && this.opcode <= WsOpcode.PONG;
  }
  
  private parse() {
    while (this.loop) {
      switch (this.state) {
        case WsState.BASE_HEADER:
          this.parseBaseHeader();
          break;
        case WsState.EXTENDED_PAYLOAD_LEN_16:
          this.parsePayloadLength16();
          break;
        case WsState.EXTENDED_PAYLOAD_LEN_64:
          this.parsePayloadLength64();
          break;
        case WsState.AFTER_PAYLOAD_LEN:
          this.afterPayloadLen();
          break;
        case WsState.MASKING_KEY:
          this.parseMaskingKey();
          break;
        case WsState.PAYLOAD:
          this.parsePayload();
          break;
        case WsState.COMPLETE:
          this.onComplete();
          break;
      }
    }
  }

  private parseBaseHeader() {
    if (this.remaining() < 2) {
      this.loop = false;
      return;
    }
    // Parse 1st byte:
    const byte1 = this.buf.readUInt8(this.offset);
    this.offset += 1;

    this.fin = Boolean(byte1 & 128);

    const rsv1 = byte1 & 64;
    const rsv2 = byte1 & 32;
    const rsv3 = byte1 & 16;
    if (rsv1 !== 0 || rsv2 !== 0 || rsv3 !== 0) {
      throw new Error("RSV1, RSV2 and RSV3 must be clear.");
    }

    this.opcode = byte1 & 15;
    if (this.opcode === WsOpcode.CONTINUATION && this.fragments.length === 0) {
      throw new Error("Continuation frame cannot be the first frame in a message.");
    }

    if (this.isControlFrame() && this.fin === false) {
      throw new Error('FIN must be set for control frames.');
    }

    if (this.opcode === WsOpcode.BINARY) {
      this.isBinary = true;
    }

    // Parse 2nd byte:
    const byte2 = this.buf.readUInt8(this.offset);
    this.offset += 1;

    this.mask = Boolean(byte2 & 128);
    const payloadLen = byte2 & 127;

    if (payloadLen < 126) {
      this.payloadLen = payloadLen;
      this.state = WsState.AFTER_PAYLOAD_LEN;
      return;
    }
    
    if (this.isControlFrame()) {
      throw new Error('Control frames cannot have payload length > 125.');
    }

    if (payloadLen === 126) {
      this.state = WsState.EXTENDED_PAYLOAD_LEN_16;
    } else {
      this.state = WsState.EXTENDED_PAYLOAD_LEN_64;
    }
  }

  private parsePayloadLength16() {
    if (this.remaining() < 2) {
      this.loop = false;
      return;
    }

    this.payloadLen = this.buf.readUInt16BE(this.offset);
    this.offset += 2;

    this.state = WsState.AFTER_PAYLOAD_LEN;
  }

  private parsePayloadLength64() {
    if (this.remaining() < 8) {
      this.loop = false;
      return;
    }
    const len = this.buf.readBigUInt64BE(this.offset);
    this.offset += 8;

    if (len >= Number.MAX_SAFE_INTEGER) {
      throw new Error("Unsupported frame payload length.");
    }
    this.payloadLen = Number(len);

    this.state = WsState.AFTER_PAYLOAD_LEN;
  }

  private afterPayloadLen() {
    if (this.mask) {
      this.state = WsState.MASKING_KEY;
    } else {
      this.state = WsState.PAYLOAD;
    }
  }

  private parseMaskingKey() {
    if (this.remaining() < 4) {
      this.loop = false;
      return;
    }

    this.maskingKey = this.buf.subarray(this.offset, this.offset + 4);
    this.offset += 4;
    this.state = WsState.PAYLOAD;
  }

  private parsePayload() {
    if (this.remaining() < this.payloadLen) {
      this.loop = false;
      return;
    }

    let payload = this.buf.subarray(this.offset, this.offset + this.payloadLen);
    this.offset += payload.byteLength;

    if (this.mask) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= this.maskingKey[i % 4];
      }
    }

    if (this.isControlFrame()) {
      this.handleControlFrame(payload);
    } else {
      this.fragments.push(payload);
      this.handleFrame();
    }

    this.state = WsState.COMPLETE;
  }

  private handleControlFrame(payload: Buffer) {
    switch (this.opcode) {
      case WsOpcode.CLOSE:
        this.emit("close", payload);
        break;
      case WsOpcode.PING:
        this.emit("ping", payload);
        break;
      case WsOpcode.PONG:
        this.emit("pong", payload);
        break;
    }
  }

  private handleFrame() {
    if (this.fin) {
      this.emit("message", Buffer.concat(this.fragments), this.isBinary);
      this.fragments = [];
    }
  }

  private onComplete() {
    this.reset();

    if (this.remaining() <= 0) {
      this.loop = false;
    }
  }
}
