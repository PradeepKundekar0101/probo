import express from "express";
import { buyStock,cancelOrder,sellStock} from "../controller/order";
export const orderRouter = express.Router();
orderRouter.post("/buy", buyStock);
orderRouter.post("/sell", sellStock);
orderRouter.post("/cancel",cancelOrder)

