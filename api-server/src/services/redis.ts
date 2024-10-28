import Redis from "ioredis";
import { generateId } from "../utils/generateOrderId";
import dotenv from "dotenv"
dotenv.config()

const REDIS_URL = process.env.REDIS_URL
export const redis = new Redis(REDIS_URL!);
export const subscriber = new Redis(REDIS_URL!);
export async function pushToQueue(endPoint: string, data: any, res?: any) {
  try {
    const eventId = generateId(); 
    const message = { endPoint, data, eventId };
    await redis.lpush("messageQueue", JSON.stringify(message));

    console.log(`Waiting for response for event: ${eventId}`);

    const messageHandler = async (channel: string, messageFromPublisher: string) => {
      if (channel === eventId) {
        subscriber.unsubscribe(eventId); 
        const { statusCode, message, data } = JSON.parse(messageFromPublisher);
        res && res.status(statusCode).send({ message, data });
      }
    };

    res && subscriber.subscribe(eventId); 
    res && subscriber.on("message", messageHandler);

  } catch (error) {
    console.error("Error queuing message:", error);
    res && res.status(500).send({ status: "Error queuing message" });
  }
}