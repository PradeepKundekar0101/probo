import express from "express"
export const userRouter = express.Router();
import { createUser } from "../controllers/user";
export const marketRouter = express.Router();
userRouter.post("/create/",createUser )