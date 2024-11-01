import Redis from "ioredis";
import dotenv from "dotenv";
import { processMessages } from "./app";
import express from "express";
import { createProducer, produceMessage } from "./services/kafka";
import { SnapShotManager } from "./services/snapshot";
import { GlobalData } from "./db";
import moment from "moment";
export const app = express();
dotenv.config();
const REDIS_URL = process.env.REDIS_URL

export const redis = new Redis(REDIS_URL!);

const pollQueue = async () => {
  while (true) {
    await processMessages();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

const snapshotManager = new SnapShotManager({
  accessId: process.env.AWS_ACCESS_KEY_ID_S3_USER!,
  secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET_S3_USER!,
  bucket: process.env.SNAP_SHOTS_BUCKET_NAME!,
  interval: 10000,
  data: GlobalData,
  region: process.env.AWS_REGION!,
});

const recoverDataFromSnapshot = async (): Promise<void> => {
  try {
    const recoveredData = await snapshotManager.recoverLatestData();
    if (recoveredData.data) {
      Object.assign(GlobalData.inrBalances, recoveredData.data.inrBalances || {});
      Object.assign(GlobalData.stockBalances, recoveredData.data.stockBalances || {});
      Object.assign(GlobalData.orderBook, recoveredData.data.orderBook || {});
      Object.assign(GlobalData.markets, recoveredData.data.markets || {}); 
      GlobalData.ordersList = recoveredData.data.ordersList || [];
    }
  } catch (error) {
    console.error('Failed to recover data from snapshot:', error);
    console.log('Starting with fresh state');
  }
};

const startServer = async () => {
  try {
    await recoverDataFromSnapshot();

    pollQueue();
    createProducer();
    snapshotManager.startSnapShotting();
  

    app.listen(8001, () => {
      console.log("API server Listening at 8001");
    });


    process.on("SIGTERM", async () => {
      snapshotManager.stopSnapShotting();
      try {
        await snapshotManager.createSnapShot();
      } catch (error) {
        console.error("Failed to create final snapshot:", error);
      }
      process.exit(0);
    });

  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

