import express from "express";
import { pushToQueue } from "../services/redis";
import { multerUpload } from "../services/multer";
import { createCategory, createMarket, getCategories, getMarkets } from "../controllers/market";

export const marketRouter = express.Router();

marketRouter.post("/createMarket", multerUpload.single("image"),createMarket);
marketRouter.post("/createCategory",multerUpload.single("image"),createCategory)
marketRouter.get("/getMarkets",getMarkets)
marketRouter.get("/getCategories",getCategories)