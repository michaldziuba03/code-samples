import { Socket } from "net";
import { IFrame, WsParser } from "./parser";

export class WsConnection {
  private readonly parser = new WsParser();
  private message: IFrame[] = [];
  
  public onData: (data: Buffer) => void = () => {};

  constructor(private socket: Socket) {
    this.socket.setKeepAlive(true);
    this.socket.setTimeout(0);
    this.socket.on("data", this.handleData.bind(this));
  }

  private handleData(chunk: Buffer) {
    const frames = this.parser.parse(chunk);
    if (!frames) {
      // probably partial frame
      return;
    }

    for (const frame of frames) {
      if (frame.opcode === 0x8) {
        // Close frame
        console.log("Received close frame, closing connection");
        this.socket.end();
      } else if (frame.opcode === 0x1 || frame.opcode === 0x2) {
        // Text or Binary frame
        this.message.push(frame);
        console.log("Received message frame:", frame);
      } else {
        console.warn("Received unsupported opcode:", frame.opcode);
      }

      if (frame.fin) {
        console.log("total frames:", this.message.length);
        const payload = this.joinPayload(this.message);
        this.onData(payload);
        this.message = [];
      }
    }
  }

  private joinPayload(frames: IFrame[]) {
    let totalLen = 0;
    const buffers = frames.map((frame) => {
      totalLen += frame.payload.byteLength;
      return frame.payload;
    });

    return Buffer.concat(buffers, totalLen);
  }
}
