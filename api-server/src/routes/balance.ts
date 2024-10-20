import express, { Request } from "express";
import { pushToQueue } from "../utils/redis";

export const balanceRouter = express.Router();

balanceRouter.get("/inr/:userId", (req: Request, res) => {
  try {
    pushToQueue("INR_balance", { user: req.params.userId }, res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});
balanceRouter.get("/inr/", (req: Request, res) => {
  try {
    pushToQueue("All_INR_balance", {}, res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});
balanceRouter.get("/stock/:userId", (req: Request, res) => {
  try {
    pushToQueue("getStockByUserId", { user: req.params.userId }, res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});
balanceRouter.get("/stock/", (req: Request, res) => {
  try {
    pushToQueue("All_stock_balance", {}, res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});
