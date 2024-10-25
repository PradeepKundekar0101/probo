import express, { Request } from "express";
import { pushToQueue } from "../services/redis";
import { isAuthenticated } from "../middleware/auth";
import { getInrBalanceByUserId } from "../controllers/balance";

export const balanceRouter = express.Router();

balanceRouter.get("/inr/", isAuthenticated,getInrBalanceByUserId)
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
