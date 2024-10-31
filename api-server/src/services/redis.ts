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
    if(res){
      const messageHandler = async (channel: string, messageFromPublisher: string) => {
        if (channel === eventId) {
          await subscriber.unsubscribe(eventId); 
          const { statusCode, message, data } = JSON.parse(messageFromPublisher);
          res.status(statusCode).send({ message, data });
        }
      };
      await subscriber.subscribe(eventId); 
      subscriber.on("message", messageHandler);
    }
    await redis.lpush("messageQueue", JSON.stringify(message));
    console.log(`Waiting for response for event: ${eventId}`);


  } catch (error) {
    console.error("Error queuing message:", error);
    res && res.status(500).send({ status: "Error queuing message" });
  }
}