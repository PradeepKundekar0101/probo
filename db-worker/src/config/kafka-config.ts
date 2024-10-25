import { Kafka, logLevel } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'probo',
  brokers: ['192.168.0.55:9092'],
  logLevel: logLevel.INFO,
});