import express from "express"
export const userRouter = express.Router();
import { createUser, login } from "../controllers/user";
export const marketRouter = express.Router();
userRouter.post("/create/",createUser )
userRouter.post("/login/",login )