
import { Producer } from 'kafkajs';
import { kafka } from './kafka-config';

export class KafkaProducerService {
  private producer: Producer;

  constructor() {
    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async connect() {
    try {
      await this.producer.connect();
      console.log('Producer connected successfully');
    } catch (error) {
      console.error('Error connecting producer:', error);
      throw error;
    }
  }

  async sendMessage(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: String(Date.now()),
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log(`Message sent to topic ${topic}`);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.producer.disconnect();
    console.log('Producer disconnected');
  }
}
