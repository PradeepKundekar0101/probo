import { WebSocketServer, WebSocket } from "ws";
import app from "./app";

const PORT = process.env.PORT || 8000;
export const wss = new WebSocketServer({ noServer: true });
export const rooms = new Map<string, Set<WebSocket>>(); 

const joinRoom = (room: string, ws: WebSocket) => {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws); 
};

const broadCastMessage = (room: string, message: string) => {
  const clients = rooms.get(room);
  if (clients) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

const server = app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

interface WsData {
  event: "joinRoom" | "message";
  room?: string;
  message?: string;
}

wss.on("connection", (ws) => {
  console.log("New WebSocket connection!");

  ws.on("message", (data, isBinary) => {
    try {
      const { event, room, message }: WsData = JSON.parse(data.toString());

      if (event === "joinRoom" && room) {
        joinRoom(room, ws);
        console.log(`User joined room: ${room}`);
        ws.send(`Joined ${room}`);
      } else if (event === "message" && room && message) {
        broadCastMessage(room, message);
        ws.send(`Sent "${message}" to room ${room}`);
      } else {
        ws.send("Invalid event or missing room/message data.");
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
      ws.send("Error: Invalid message format.");
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    rooms.forEach((clients, room) => {
      clients.delete(ws);
      if (clients.size === 0) rooms.delete(room); 
    });
    console.log("WebSocket connection closed.");
  });
});
