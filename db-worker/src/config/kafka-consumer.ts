// kafka-consumer.ts
import { Consumer, EachMessagePayload } from 'kafkajs';
import { kafka } from './kafka-config';

export class KafkaConsumerService {
  private consumer: Consumer;

  constructor(groupId: string) {
    this.consumer = kafka.consumer({
      groupId,
      maxWaitTimeInMs: 100,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
  }

  async connect() {
    try {
      await this.consumer.connect();
      console.log('Consumer connected successfully');
    } catch (error) {
      console.error('Error connecting consumer:', error);
      throw error;
    }
  }

  async subscribe(topics: string[]) {
    try {
      for (const topic of topics) {
        await this.consumer.subscribe({
          topic,
          fromBeginning: true
        });
      }
      console.log(`Subscribed to topics: ${topics.join(', ')}`);
    } catch (error) {
      console.error('Error subscribing to topics:', error);
      throw error;
    }
  }

  async consume(messageHandler: (message: EachMessagePayload) => Promise<void>) {
    try {
      await this.consumer.run({
        eachMessage: async (messagePayload) => {
          try {
            await messageHandler(messagePayload);
          } catch (error) {
            console.error('Error processing message:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error consuming messages:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.consumer.disconnect();
    console.log('Consumer disconnected');
  }
}