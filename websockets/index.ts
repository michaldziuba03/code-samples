import { createHash } from 'node:crypto';
import { createServer, ServerResponse } from 'node:http';
import { WsReceiver } from './receiver';

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
  const receiver = new WsReceiver();
  receiver.on('message', (buf) => {
    console.log('Received message:', buf.toString('utf-8'));
  });

  socket.pipe(receiver);
});

server.listen(8080, () => {
  console.log('Server listening on port 8080');
});
