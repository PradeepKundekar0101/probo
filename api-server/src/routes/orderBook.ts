import express from "express"
export const orderBookRouter = express.Router();
import { pushToQueue } from "../services/redis";
export const marketRouter = express.Router();
orderBookRouter.get("/", (req, res) => {
  try {
    pushToQueue("GET_ORDER_BOOK", {}, res);
  } catch (error) {
    res.status(500).send("Error");
  }
});
