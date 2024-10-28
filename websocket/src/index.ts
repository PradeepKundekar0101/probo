import express from "express";
import http from "http";
import WebSocket from "ws";
import Redis from "ioredis";
import { broadCastMessage } from "./utils/ws";
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
});
import dotenv from "dotenv"
dotenv.config()
export const rooms = new Map<string, Set<WebSocket>>();
const REDIS_URL = process.env.REDIS_URL!
export const subscriber = new Redis(REDIS_URL);
subscriber.subscribe("MESSAGE");
subscriber.subscribe("MARKET_SETTLEMENT");
subscriber.on("message", async (channel: string, message: string) => {
  if (channel === "MESSAGE") {
    const parsedData = JSON.parse(message);
    const { stockSymbol, orderBook } = parsedData.data;

    let parsedOrderBookTemp = JSON.parse(orderBook)
    const yesOrders = parsedOrderBookTemp["yes"]
    const noOrders = parsedOrderBookTemp["no"]
    let tempOrder={yes:{},no:{}}
    Object.keys(yesOrders).map((price)=>{
        const total = parsedOrderBookTemp["yes"][price].total
        //@ts-ignore
        tempOrder.yes[price] = total
    })
    Object.keys(noOrders).map((price)=>{
      const total = parsedOrderBookTemp["no"][price].total
      //@ts-ignore
      tempOrder.no[price] = total
  })

    broadCastMessage(stockSymbol, JSON.stringify(tempOrder));
  } else if (channel === "MARKET_SETTLEMENT") {
    const parsedData = JSON.parse(message);

    const { marketId } = parsedData.data;
    broadCastMessage(marketId, JSON.stringify(parsedData));
  }
});

export const joinRoom = (room: string, ws: WebSocket) => {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);
};
wss.on("connection", (ws: WebSocket) => {
  console.log("New WebSocket connection!");
  ws.send("Welcome to server");
  ws.on("message", (data: WebSocket.Data) => {
    let parsedData;
    try {
      parsedData = JSON.parse(data.toString());
    } catch (error) {
      console.error("Failed to parse message:", error);
      ws.send("Error: Invalid message format.");
      return;
    }
    const { event, room } = parsedData;
    if (event === "joinRoom" && room) {
      joinRoom(room, ws);
      ws.send(`Joined ${room}`);
    } else {
      ws.send("Invalid event or missing room/message data.");
    }
  });

  ws.on("error", (error) => {
    if (
      error instanceof RangeError &&
      error.message.includes("Invalid WebSocket frame: RSV1 must be clear")
    ) {
      console.error(
        "WebSocket RSV1 error. This might be due to a client/server mismatch or proxy interference."
      );
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

server.listen(8003, () => {
  console.log("WebSocket Server Listening at 8003");
});
