import { Socket } from "node:net";
import { WsReceiver } from "./receiver";
import { WsEvents, WsOpcode } from "./types";
import EventEmitter from "node:events";
import { IncomingMessage } from "node:http";

export class WsConnection extends EventEmitter<WsEvents> {
  public socket: Socket;
  public req: IncomingMessage;
  private receiver: WsReceiver;

  constructor(req: IncomingMessage) {
    super();
    this.req = req;
    this.socket = req.socket;
    this.receiver = new WsReceiver();
    this.socket.pipe(this.receiver);

    this.receiver.on("message", (buf, isBinary) => {
      const data = isBinary ? buf : buf.toString("utf-8");
      this.emit("message", data, isBinary);
    });

    this.receiver.on("ping", (buf) => {
      this.sendFrame(WsOpcode.PONG, buf);
      this.emit("ping");
    });

    this.receiver.on("pong", () => {
      this.emit("pong");
    });

    this.receiver.on("close", () => {
      if (!this.socket.destroyed && this.socket.writable) {
        this.sendFrame(WsOpcode.CLOSE, Buffer.alloc(0));
      }
      this.socket.end();
      this.emit("close");
    });

    this.receiver.on("error", (err) => {
      this.emit("error", err);
      this.socket.end();
    });
  }

  send(data: Buffer | string) {
    if (typeof data === "string") {
      data = Buffer.from(data, "utf-8");
      this.sendFrame(WsOpcode.TEXT, data);
    } else {
      this.sendFrame(WsOpcode.BINARY, data);
    }
  }

  private sendFrame(
    opcode: WsOpcode,
    payload: Buffer,
    fin: boolean = true
  ): void {
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
}
