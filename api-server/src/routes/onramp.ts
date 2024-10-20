import express from "express";

import { pushToQueue } from "../utils/redis";

export const onrampRouter = express.Router();

export const marketRouter = express.Router();

onrampRouter.post("/inr", (req, res) => {
  try {
    pushToQueue("onRamp", { data: req.body }, res);
  } catch (error) {
    res.status(500).send("Error");
  }
});
