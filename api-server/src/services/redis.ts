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
      await subscriber.subscribe(eventId); 
      console.log("Subscribed to: "+eventId)
      subscriber.on("message", async (channel: string, messageFromPublisher: string) => {
        if (channel === eventId) {
          console.log("message received back")
          await subscriber.unsubscribe(eventId); 
          const { statusCode, message, data } = JSON.parse(messageFromPublisher);
          console.log("Sending response")
          res.status(statusCode).send({ message, data });
        }
      });
    }
    console.log("Pushed to queue")
    await redis.lpush("messageQueue", JSON.stringify(message));
    console.log(`Waiting for response for event: ${eventId}`);


  } catch (error) {
    console.error("Error queuing message:", error);
    res && res.status(500).send({ status: "Error queuing message" });
  }
}