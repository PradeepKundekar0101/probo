import express from "express";
import { isAuthenticated } from "../middleware/auth";
import { onRampAmount } from "../controllers/onRamp";

export const onrampRouter = express.Router();

onrampRouter.post("/inr", isAuthenticated,onRampAmount)