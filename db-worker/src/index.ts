import express from "express";
import dotenv from "dotenv";
import { startConsuming } from "./services/kafka";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8004;


startConsuming()
  .catch(error => {
    console.error('Failed to start Kafka consumer:', error);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`DB Worker running at PORT ${PORT}`);
});