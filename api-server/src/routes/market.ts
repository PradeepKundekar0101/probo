import express from "express";
import { pushToQueue } from "../utils/redis";

export const marketRouter = express.Router();

marketRouter.post("/create", (req, res) => {
  try {
    pushToQueue("createMarket", { data: req.body }, res);
  } catch (error) {
    res.status(500).send("Error");
  }
});
