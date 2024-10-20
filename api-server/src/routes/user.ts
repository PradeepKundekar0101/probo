import express from "express"

export const userRouter = express.Router();
import { pushToQueue } from "../utils/redis";
export const marketRouter = express.Router();
userRouter.post("/create/:userId", (req, res) => {
  try {
    pushToQueue("createUser", { data: req.body }, res);
  } catch (error) {
    res.status(500).send("Error");
  }
});
