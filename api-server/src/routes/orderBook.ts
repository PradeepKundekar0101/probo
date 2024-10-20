import express from "express"
export const orderBookRouter = express.Router();
import { pushToQueue } from "../utils/redis";
export const marketRouter = express.Router();
orderBookRouter.post("/", (req, res) => {
  try {
    pushToQueue("getOrderBook", { data: req.body }, res);
  } catch (error) {
    res.status(500).send("Error");
  }
});
