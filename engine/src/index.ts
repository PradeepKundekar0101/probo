
import Redis from "ioredis";
import dotenv from 'dotenv'
import { processMessages } from "./app";
import { settleMarketsOnClose } from "./controller/settleMarket";
import { Kafka } from "kafkajs";
import {app} from '../src/app'
dotenv.config()
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

const pollQueue = async () => {
  while (true) {
    await processMessages();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

setTimeout(() => {
  settleMarketsOnClose();
}, 5000);

const startServer = () => {
  pollQueue();
  initKafkaProducer();
  app.listen(8001, () => {
    console.log("API server Listening at 8001");
  });
};
startServer();
