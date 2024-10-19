import express from "express"
import { getBalance, getBalanceAll, getStockBalance,getStockBalanceAll } from "../controller/balance";

export const balanceRouter = express.Router();

balanceRouter.get("/inr/:userId",getBalance);
balanceRouter.get("/inr/",getBalanceAll);
balanceRouter.get("/stock/:userId",getStockBalance);
balanceRouter.get("/stock/",getStockBalanceAll);