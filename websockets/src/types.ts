import type { WsConnection } from "./connection";

export enum WsOpcode {
  CONTINUATION = 0x0,
  TEXT = 0x1,
  BINARY = 0x2,
  CLOSE = 0x8,
  PING = 0x9,
  PONG = 0xa,
};

export interface WsEvents {
  'message': [Buffer, true] | [string, false];
  'ping': [];
  'pong': [];
  'error': any[];
  'close': [];
}

export interface WsServerEvents {
  'connection': [WsConnection]
}
