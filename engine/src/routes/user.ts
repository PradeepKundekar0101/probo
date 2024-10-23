import express from "express"

import { createUser } from "../controller1/user";
export const userRouter = express.Router();
userRouter.post("/create/:userId",createUser);