import { Socket } from "node:net";

enum WsOpcode {
  CONTINUATION = 0x0,
  TEXT = 0x1,
  BINARY = 0x2,
  CLOSE = 0x8,
  PING = 0x9,
  PONG = 0xa,
}

export class WsSender {
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  sendText(message: string): void {
    const payload = Buffer.from(message, 'utf-8');
    this.sendFrame(WsOpcode.TEXT, payload);
  }

  sendBinary(data: Buffer): void {
    this.sendFrame(WsOpcode.BINARY, data);
  }

  sendPing(data: Buffer = Buffer.alloc(0)): void {
    this.sendFrame(WsOpcode.PING, data);
  }

  sendPong(data: Buffer = Buffer.alloc(0)): void {
    this.sendFrame(WsOpcode.PONG, data);
  }

  sendClose(code?: number, reason?: string): void {
    let payload = Buffer.alloc(0);
    
    if (code !== undefined) {
      payload = Buffer.alloc(2);
      payload.writeUInt16BE(code, 0);
      
      if (reason) {
        const reasonBuffer = Buffer.from(reason, 'utf-8');
        payload = Buffer.concat([payload, reasonBuffer]);
      }
    }
    
    this.sendFrame(WsOpcode.CLOSE, payload);
  }

  private sendFrame(opcode: WsOpcode, payload: Buffer, fin: boolean = true): void {
    const payloadLength = payload.length;
    let headerSize = 2;

    if (payloadLength > 65535) {
      headerSize += 8;
    } else if (payloadLength > 125) {
      headerSize += 2;
    }

    const frame = Buffer.alloc(headerSize + payloadLength);
    let offset = 0;

    const firstByte = (fin ? 0x80 : 0x00) | opcode;
    frame.writeUInt8(firstByte, offset++);

    if (payloadLength > 65535) {
      frame.writeUInt8(127, offset++);
      frame.writeBigUInt64BE(BigInt(payloadLength), offset);
      offset += 8;
    } else if (payloadLength > 125) {
      frame.writeUInt8(126, offset++);
      frame.writeUInt16BE(payloadLength, offset);
      offset += 2;
    } else {
      frame.writeUInt8(payloadLength, offset++);
    }

    payload.copy(frame, offset);

    this.socket.write(frame);
  }

  isConnected(): boolean {
    return !this.socket.destroyed && this.socket.writable;
  }

  close(): void {
    if (this.isConnected()) {
      this.sendClose(1000, 'Normal closure');
      this.socket.end();
    }
  }
}
