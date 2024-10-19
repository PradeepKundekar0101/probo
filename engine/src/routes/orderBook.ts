import express from "express"
import { getOrderBook } from "../controller/orderBook";
export const orderBookRouter = express.Router();
orderBookRouter.get("/",getOrderBook);
