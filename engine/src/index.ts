import express from "express";
import http from "http";
import Redis from "ioredis";
import { processMessages } from "./app";
import { settleMarketsOnClose } from "./controller/settleMarket";
import { Kafka } from "kafkajs";
const app = express();
const server = http.createServer(app);
export const redis = new Redis({ port: 6379, host: "localhost" });
const kafkaClient = new Kafka({
  clientId: "probo",
  brokers: ["192.168.0.55:9092"],
});
let kafkaProducer = null;
const initKafkaProducer = async () => {
  try {
    kafkaProducer = kafkaClient.producer({});
    await kafkaProducer.connect();
    console.log("Kafka producer connected");
  } catch (error) {
    console.log(error);
  }
  // await kafkaProducer.send({

  //   topic:"",
  //   messages:[
  //     {
  //       key:"",
  //       value:"",
  //     }
  //   ]
  // })
};
initKafkaProducer();

const pollQueue = async () => {
  while (true) {
    await processMessages();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};
pollQueue();

server.listen(8001, () => {
  console.log("Listening at 8001");
});

setTimeout(() => {
  settleMarketsOnClose();
}, 5000);
