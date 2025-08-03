import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";
import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse,
} from "node:http";
import { WsConnection } from "./connection";
import { WsServerEvents } from "./types";

export class WsServer extends EventEmitter<WsServerEvents> {
  private server: Server;

  constructor() {
    super();
    this.server = createServer(this.handleReq.bind(this));
  }

  private handleReq(req: IncomingMessage, res: ServerResponse) {
    console.log("Received request");
    const wsAcceptKey = req.headers["sec-websocket-key"];
    if (!wsAcceptKey) {
      res.statusCode = 400; // Bad Request
      res.end("WebSocket key not provided\n");
      return;
    }

    const acceptKey = this.createWsAcceptKey(wsAcceptKey);
    this.finalizeHandshake(res, acceptKey);
    this.emit("connection", new WsConnection(req));
  }

  private createWsAcceptKey(wsKey: string): string {
    const uuid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"; // constant UUID definied in WS docs
    const dataToHash = wsKey + uuid;

    return createHash("sha1").update(Buffer.from(dataToHash)).digest("base64");
  }

  private finalizeHandshake(res: ServerResponse, wsAcceptKey: string) {
    res.statusCode = 101;
    // set headers:
    res.setHeader("Upgrade", "websocket");
    res.setHeader("Connection", "Upgrade");
    res.setHeader("Sec-WebSocket-Accept", wsAcceptKey);

    res.write("\r\n");
    res.end();
  }

  listen(port: number) {
    this.server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }
}
