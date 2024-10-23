import express, { Request } from "express";
import { pushToQueue } from "../utils/redis";

export const balanceRouter = express.Router();

balanceRouter.get("/inr/:userId", (req: Request, res) => {
  try {
    pushToQueue("GET_INR_BALANCE_USERID", req.params.userId, res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});
balanceRouter.get("/inr/", (req: Request, res) => {
  try {
    pushToQueue("GET_INR_BALANCE_ALL", {}, res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});
balanceRouter.get("/stock/:userId", (req: Request, res) => {
  try {
    pushToQueue("GET_STOCK_BALANCE_USERID", req.params.userId , res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});
balanceRouter.get("/stock/", (req: Request, res) => {
  try {
    pushToQueue("GET_STOCK_BALANCE_ALL", {}, res);
  } catch (error: any) {
    res.status(500).send(error?.message);
  }
});
