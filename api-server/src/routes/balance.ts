import express, { Request } from "express";
import { pushToQueue } from "../services/redis";
import { isAuthenticated } from "../middleware/auth";
import { getInrBalanceByUserId, getStockBalanceByUserId } from "../controllers/balance";

export const balanceRouter = express.Router();

balanceRouter.get("/inr/", isAuthenticated,getInrBalanceByUserId)
balanceRouter.get("/stock/", isAuthenticated,getStockBalanceByUserId)
