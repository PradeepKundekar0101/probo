import express from "express";
import { pushToQueue } from "../services/redis";
import { multerUpload } from "../services/multer";
import { createCategory, createMarket, getCategories, getMarketById, getMarkets, getPrices, settleMarket } from "../controllers/market";

export const marketRouter = express.Router();

marketRouter.post("/createMarket", multerUpload.single("image"),createMarket);
marketRouter.post("/createCategory",multerUpload.single("image"),createCategory)
marketRouter.get("/getMarkets",getMarkets)
marketRouter.get("/price/:marketId",getPrices)
marketRouter.get("/getMarket/:marketId",getMarketById)
marketRouter.post("/settle",settleMarket)
marketRouter.get("/getCategories",getCategories)
