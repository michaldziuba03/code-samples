import { WsServer } from "./server";

const server = new WsServer();

server.on("connection", (ws) => {
  console.log("New WebSocket connection established");
  ws.on("message", (data, isBinary) => {
    if (isBinary) {
      console.log("Received binary message:", data);
    } else {
      console.log("Received text message:", data);
      // Echo the message back
      ws.send(data);
    }
  });

  ws.on("ping", () => {
    console.log("Received ping");
  });

  ws.on("pong", () => {
    console.log("Received pong");
  });

  ws.on("close", () => {
    console.log("Connection closed");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

server.listen(8080);
