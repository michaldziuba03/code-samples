export interface IFrame {
  fin: boolean;
  rsv1: number;
  rsv2: number;
  rsv3: number;
  opcode: number;
  mask: boolean;
  payloadLen: number;
  payload: Buffer;
  frameLen: number;
}

enum WsParserState {
  START,
  FIRST_BYTE,
  SECOND_BYTE,
  EXTENDED_PAYLOAD_LEN_16,
  EXTENDED_PAYLOAD_LEN_64,
  MASKING_KEY,
  PAYLOAD,
  COMPLETE,
}

export class WsParser {
  private parsed: IFrame[] = [];
  private state: WsParserState = WsParserState.START;
  private buf: Buffer = Buffer.alloc(0);
  private offset = 0;
  private maskingKey: Buffer = Buffer.alloc(0);

  private frame: IFrame = {
    fin: false,
    rsv1: 0,
    rsv2: 0,
    rsv3: 0,
    opcode: 0,
    mask: false,
    payloadLen: 0,
    payload: Buffer.alloc(0),
    frameLen: 0,
  };

  private reset() {
    const buf = this.remaining() >= 0 ? this.buf.subarray(this.offset, this.buf.byteLength) : Buffer.alloc(0);
    console.log('Resetting parser, remaining bytes:', buf.byteLength);
    this.state = WsParserState.START;
    this.buf = buf;
    this.offset = 0;
    this.maskingKey = Buffer.alloc(0);
    this.frame = {
      fin: false,
      rsv1: 0,
      rsv2: 0,
      rsv3: 0,
      opcode: 0,
      mask: false,
      payloadLen: 0,
      payload: Buffer.alloc(0),
      frameLen: 0,
    };
  }

  private nextPayloadState() {
    if (this.frame.mask) {
      return WsParserState.MASKING_KEY;
    }
    return WsParserState.PAYLOAD;
  }

  private parseFirstByte() {
    const firstByte = this.buf.readUInt8(this.offset);
    this.offset += 1;

    this.frame.fin = Boolean(firstByte & 128);
    this.frame.rsv1 = firstByte & 64;
    this.frame.rsv2 = firstByte & 32;
    this.frame.rsv3 = firstByte & 16;
    this.frame.opcode = firstByte & 15;

    this.state = WsParserState.SECOND_BYTE;
  }

  private parseSecondByte() {
    const secondByte = this.buf.readUInt8(this.offset);
    this.offset += 1;
    this.frame.mask = Boolean(secondByte & 128);
    const payloadLen = secondByte & 127;
    this.frame.payloadLen = payloadLen;

    if (payloadLen < 126) {
      this.state = this.nextPayloadState();
    } else if (payloadLen === 126) {
      this.state = WsParserState.EXTENDED_PAYLOAD_LEN_16;
    } else {
      this.state = WsParserState.EXTENDED_PAYLOAD_LEN_64;
    }
  }

  private remaining() {
    return this.buf.byteLength - this.offset;
  }

  parse(chunk: Buffer): IFrame[] | undefined {
    this.buf = Buffer.concat([this.buf, chunk]);
    
    while (this.remaining() >= 0) {
      switch (this.state) {
        case WsParserState.START:
          this.state = WsParserState.FIRST_BYTE;
          break;
        case WsParserState.FIRST_BYTE:
          if (this.remaining() < 1) return;
          this.parseFirstByte();
          break;
        case WsParserState.SECOND_BYTE:
          if (this.remaining() < 1) return;
          this.parseSecondByte();
          break;
        case WsParserState.EXTENDED_PAYLOAD_LEN_16:
          if (this.remaining() < 2) return;
          this.frame.payloadLen = this.buf.readUInt16BE(this.offset);
          this.offset += 2;
          this.state = this.nextPayloadState();
          break;
        case WsParserState.EXTENDED_PAYLOAD_LEN_64:
          if (this.remaining() < 8) return;
          this.frame.payloadLen = Number(this.buf.readBigUInt64BE(this.offset));
          this.offset += 8;
          this.state = this.nextPayloadState();
          break;
        case WsParserState.MASKING_KEY:
          if (this.remaining() < 4) return;
          this.maskingKey = this.buf.subarray(this.offset, this.offset + 4);
          this.offset += 4;
          this.state = WsParserState.PAYLOAD;
          break;
        case WsParserState.PAYLOAD:
          const bytesToRead = Math.min(this.remaining(), this.frame.payloadLen - this.frame.payload.byteLength);
          if (bytesToRead <= 0) {
            this.state = WsParserState.COMPLETE;
            break;
          }
          const payloadChunk = this.buf.subarray(this.offset, this.offset + bytesToRead);
          this.offset += bytesToRead;
          this.frame.payload = Buffer.concat([this.frame.payload, payloadChunk]);
          if (this.frame.payload.byteLength < this.frame.payloadLen) {
            return;
          }
          this.state = WsParserState.COMPLETE;
          break;
        case WsParserState.COMPLETE:
          this.frame.frameLen = this.offset;
          if (this.frame.mask) {
            this.frame.payload = this.unmask(this.frame.payload, this.frame.payloadLen, this.maskingKey);
          }

          const completedFrame = { ...this.frame };
          this.reset();
          this.parsed.push(completedFrame);
          if (this.remaining() > 0) {
            this.state = WsParserState.START;
            break;
          }

          const frames = this.parsed;
          this.parsed = [];
          return frames;
      }
    }
  }

  private unmask(rawPayload: Buffer, payloadLen: number, maskingKey: Buffer) {
    const payload = Buffer.alloc(payloadLen);
    for (let i = 0; i < payloadLen; ++i) {
      const j = i % 4;
      const decoded = rawPayload[i] ^ maskingKey[j];
      payload.writeUInt8(decoded, i);
    }

    return payload;
  }
}
