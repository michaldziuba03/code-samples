import { createHash } from 'node:crypto';
import { createServer, ServerResponse } from 'node:http';
import { WsReceiver } from './receiver';
import { WsSender } from './sender';

function createWsAcceptKey(wsKey: string): string {
    const uuid = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'; // constant UUID definied in WS docs
    const dataToHash = wsKey + uuid

    return createHash('sha1')
        .update(Buffer.from(dataToHash))
        .digest('base64');
}

function finalizeHandshake(res: ServerResponse, wsAcceptKey: string) {
    res.statusCode = 101;
    // set headers:
    res.setHeader('Upgrade', 'websocket');
    res.setHeader('Connection', 'Upgrade');
    res.setHeader('Sec-WebSocket-Accept', wsAcceptKey);
    
    res.write('\r\n');
    res.end();
}

const server = createServer((req, res) => {
  console.log('Received request');
  const wsAcceptKey = req.headers['sec-websocket-key'];
  if (!wsAcceptKey) {
    res.statusCode = 400; // Bad Request
    res.end('WebSocket key not provided\n');
    return;
  }

  const acceptKey = createWsAcceptKey(wsAcceptKey);
  finalizeHandshake(res, acceptKey);

  const socket = req.socket;
  const sender = new WsSender(socket);
  const receiver = new WsReceiver();

  sender.sendText('Hello from server!');

  receiver.on('message', (buf, isBinary) => {
    if (isBinary) {
      console.log('Received binary message:', buf);
    } else {
      console.log('Received text message:', buf.toString('utf-8'));
      sender.sendText(buf.toString('utf-8'));
    }
  });

  receiver.on('ping', (buf) => {
    console.log('Received PING:', buf);
    sender.sendPong(buf);
  });

  receiver.on('pong', (buf) => {
    console.log('Received PONG:', buf);
  });

  receiver.on('close', (buf: Buffer) => {
    console.log('Received CLOSE:', buf);
    sender.sendClose(1000, 'Connection closed by server');
    socket.end();
  });

  socket.pipe(receiver);
});

server.listen(8080, () => {
  console.log('Server listening on port 8080');
});
