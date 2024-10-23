export interface WsData {
    event: "joinRoom" | "message";
    room?: string;
    message?: string;
  }
