import express from "express"
import { onrampInr } from "../controller/onramp";

export const onrampRouter = express.Router();

onrampRouter.post("/inr/",onrampInr);