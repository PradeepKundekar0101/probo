import express from "express";
import http from "http";
import WebSocket from "ws";
import Redis from "ioredis";
import { broadCastMessage } from "./utils/ws";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

interface OrderBook {
  [stockSymbol: string]: {
    yes: { [price: number]: number };
    no: { [price: number]: number };
  };
}

interface ParsedMessage {
  event: string;
  room: string;
}

const REDIS_URL = process.env.REDIS_URL!;
const PORT = 8003;
const ORDERBOOK_URL = "http://localhost:8000/orderbook";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

export const subscriber = new Redis(REDIS_URL);

export const rooms = new Map<string, Set<WebSocket>>();
let orderBook: OrderBook = {};

const setupRedisSubscriptions = () => {
  subscriber.subscribe("MESSAGE", "MARKET_SETTLEMENT");

  subscriber.on("message", async (channel: string, message: string) => {
    handleRedisMessage(channel, message);
  });
};

const handleRedisMessage = (channel: string, message: string) => {
  const parsedData = JSON.parse(message);

  switch (channel) {
    case "MESSAGE":
      handleOrderBookUpdate(parsedData);
      break;
    case "MARKET_SETTLEMENT":
      handleMarketSettlement(parsedData);
      break;
  }
};

const handleOrderBookUpdate = (parsedData: any) => {
  const { stockSymbol, orderBook: newOrderBook } = parsedData.data;
  const parsedOrderBook = JSON.parse(newOrderBook);

  const processedOrder = {
    yes: processOrders(parsedOrderBook.yes),
    no: processOrders(parsedOrderBook.no),
  };
    orderBook[stockSymbol] = processedOrder;

  broadCastMessage(stockSymbol, JSON.stringify({type:"orderBook",data:processedOrder}));
};
const processOrders = (orders: { [price: string]: { total: number } }) => {
  const processed: { [price: number]: number } = {};
  Object.entries(orders).forEach(([price, data]) => {
    processed[Number(price)] = data.total;
  });
  return processed;
};

const handleMarketSettlement = (parsedData: any) => {
  const { marketId } = parsedData.data;
  broadCastMessage(marketId, JSON.stringify(parsedData));
};


export const joinRoom = (room: string, ws: WebSocket) => {
  if (!rooms.has(room)) {
    rooms.set(room, new Set());
  }
  rooms.get(room)!.add(ws);
};


const handleWebSocketConnection = (ws: WebSocket) => {
  console.log("New WebSocket connection!");
  ws.send(JSON.stringify({type:"message",data:"Welcome to server"}));

  ws.on("message", (data: WebSocket.Data) => handleWebSocketMessage(ws, data));
  ws.on("error", handleWebSocketError(ws));
  ws.on("close", () => handleWebSocketClose(ws));
};

const handleWebSocketMessage = (ws: WebSocket, data: WebSocket.Data) => {
  let parsedData: ParsedMessage;

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

    ws.send(JSON.stringify({ type: "orderBook", data: orderBook[room] }));
  } else {
    ws.send(JSON.stringify({ type: "error", data: "Invalid event or missing room/message data." }))
  }
};

const handleWebSocketError = (ws: WebSocket) => (error: Error) => {
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
};

const handleWebSocketClose = (ws: WebSocket) => {
  rooms.forEach((clients, room) => {
    clients.delete(ws);
    if (clients.size === 0) {
      rooms.delete(room);
    }
  });
  console.log("WebSocket connection closed.");
};


const fetchInitialOrderBook = async () => {
  try {
    const response = await axios.get(ORDERBOOK_URL);
    const fetchedOrderBook = response.data;
    if (fetchedOrderBook && typeof fetchedOrderBook === "object") {
      const rawOB = fetchedOrderBook.data;
      Object.keys(rawOB).map((e)=>{
        orderBook[e] = {
          yes: processOrders(rawOB[e].yes),
          no: processOrders(rawOB[e].no),
        };
      })
      console.log("Initial orderbook fetched successfully");

    }
  } catch (error) {
    console.error("Failed to fetch initial orderbook:", error);
  }
};


const initializeServer = async () => {
  setupRedisSubscriptions();
  wss.on("connection", handleWebSocketConnection);
  await fetchInitialOrderBook();
  server.listen(PORT, () => {
    console.log(`WebSocket Server Listening at ${PORT}`);
  });
};

initializeServer();
