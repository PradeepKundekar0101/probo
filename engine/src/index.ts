import express from "express";
import http from "http";
import WebSocket from "ws";
import { broadCastMessage } from "./utils/ws";
import Redis from "ioredis";
import { processMessages } from "./app";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server
});
export const rooms = new Map<string, Set<WebSocket>>();
export const redis = new Redis({ port: 6379, host: "localhost" });


export const joinRoom = (room: string, ws: WebSocket) => {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);
  console.log("Added to room");
  console.log(rooms);
};

wss.on("connection", (ws: WebSocket) => {
  console.log("New WebSocket connection!");
    ws.send("Welcome to server")
  ws.on("message", (data: WebSocket.Data,) => {
    console.log("first")
    let parsedData;
   
    try {
      parsedData = JSON.parse(data.toString());
    } catch (error) {
      console.error("Failed to parse message:", error);
      ws.send("Error: Invalid message format.");
      return;
    }
    
    const { event, room, message } = parsedData;

    if (event === "joinRoom" && room) {
      console.log("Joining room" + room);
      joinRoom(room, ws);
      console.log(`User joined room: ${room}`);
      ws.send(`Joined ${room}`);
    } else if (event === "message" && room && message) {
      broadCastMessage(room, message);
      ws.send(`Sent "${message}" to room ${room}`);
    } else {
      ws.send("Invalid event or missing room/message data.");
    }
  });

  ws.on("error", (error) => {
    if (error instanceof RangeError && error.message.includes("Invalid WebSocket frame: RSV1 must be clear")) {
      console.error("WebSocket RSV1 error. This might be due to a client/server mismatch or proxy interference.");
      ws.close(1002, "Protocol error");
    } else {
      console.error("WebSocket error:", error);
    }
  });

  ws.on("close", () => {
    rooms.forEach((clients, room) => {
      clients.delete(ws);
      if (clients.size === 0) rooms.delete(room);
    });
    console.log("WebSocket connection closed.");
  });
});

const pollQueue = async () => {
  while (true) {
    await processMessages();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

pollQueue();
server.listen(3000, () => { console.log("Listening at 3000") });