"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 8000;
const wss = new ws_1.WebSocketServer({ noServer: true });
const rooms = new Map(); // Store room clients
const joinRoom = (room, ws) => {
    if (!rooms.has(room))
        rooms.set(room, new Set());
    rooms.get(room).add(ws);
};
const broadCastMessage = (room, message) => {
    const clients = rooms.get(room);
    if (clients) {
        clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
};
const server = app_1.default.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});
server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
    });
});
wss.on("connection", (ws) => {
    console.log("New WebSocket connection!");
    ws.on("message", (data, isBinary) => {
        try {
            const { event, room, message } = JSON.parse(data.toString());
            if (event === "joinRoom" && room) {
                joinRoom(room, ws);
                console.log(`User joined room: ${room}`);
                ws.send(`Joined ${room}`);
            }
            else if (event === "message" && room && message) {
                broadCastMessage(room, message);
                ws.send(`Sent "${message}" to room ${room}`);
            }
            else {
                ws.send("Invalid event or missing room/message data.");
            }
        }
        catch (error) {
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
            if (clients.size === 0)
                rooms.delete(room); // Delete empty room
        });
        console.log("WebSocket connection closed.");
    });
});
