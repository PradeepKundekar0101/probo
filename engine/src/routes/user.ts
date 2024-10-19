import express from "express"

import { createUser } from "../controller/user";
export const userRouter = express.Router();
userRouter.post("/create/:userId",createUser);