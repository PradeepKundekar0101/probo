import { rooms } from "../index";
import WebSocket from "ws"
export const broadCastMessage = (room: string, message: string) => {
    const clients = rooms.get(room);
    if (clients) {
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN ) {
          client.send(message);
        }
      });
    }
  };
  