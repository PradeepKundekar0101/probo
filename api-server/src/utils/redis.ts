import { redis, subscriber } from "..";
import { generateId } from "./generateOrderId";

export async function pushToQueue(endPoint: string, data: any, res: any) {
  try {
    const eventId = generateId(); 
    const message = { endPoint, data, eventId };
    await redis.lpush("messageQueue", JSON.stringify(message));

    console.log(`Waiting for response for event: ${eventId}`);

    const messageHandler = async (channel: string, messageFromPublisher: string) => {
      if (channel === eventId) {
        subscriber.unsubscribe(eventId); 
        const { statusCode, message, data } = JSON.parse(messageFromPublisher);
        res.status(statusCode).send({ message, data });
      }
    };

    subscriber.subscribe(eventId); 
    subscriber.on("message", messageHandler);

  } catch (error) {
    console.error("Error queuing message:", error);
    res.status(500).send({ status: "Error queuing message" });
  }
}
