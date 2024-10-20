import express from "express"

import { createMarket,settleMarket } from "../controller/market";
export const marketRouter = express.Router();

marketRouter.post("/create",createMarket);
marketRouter.post("/settleMarket",settleMarket);
// marketRouter.get("/getPrice/:stockSymbol",getMarketPrice);
    