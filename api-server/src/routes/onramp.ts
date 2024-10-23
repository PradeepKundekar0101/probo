import express from "express";

import { pushToQueue } from "../utils/redis";

export const onrampRouter = express.Router();


onrampRouter.post("/inr", (req, res) => {
  try {
    pushToQueue("ONRAMP", req.body, res);
  } catch (error) {
    res.status(500).send("Error");
  }
});
