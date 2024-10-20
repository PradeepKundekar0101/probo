import express from "express";

import { pushToQueue } from "../utils/redis";
export const orderRouter = express.Router();

orderRouter.post("/buy", (req,res)=>{
    try {
        pushToQueue("buy",req.body,res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
});
orderRouter.post("/sell", (req,res)=>{
    try {
        pushToQueue("sell",req.body,res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
});
orderRouter.post("/cancel", (req,res)=>{
    try {
        pushToQueue("cancel",req.body,res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
});


orderRouter.get("/:user",(req,res)=>{
    try {
        pushToQueue("getOrdersByUserId",req.params.user,res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
})    
 