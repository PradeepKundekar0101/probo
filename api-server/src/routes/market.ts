import express from "express";
import { pushToQueue } from "../services/redis";
import { multerUpload } from "../services/multer";
import { createCategory, createMarket } from "../controllers/market";

export const marketRouter = express.Router();

marketRouter.post("/createCategory",multerUpload.single("image"),createCategory)

marketRouter.post("/create", createMarket);
