import express from "express";

import { pushToQueue } from "../services/redis";
import { AuthRequest, isAuthenticated } from "../middleware/auth";
import { prismaClient } from "../services/prisma";
export const orderRouter = express.Router();

orderRouter.post("/buy", isAuthenticated, (req:AuthRequest,res)=>{
    try {
        pushToQueue("BUY_STOCK",{...req.body,userId:req.userId},res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
});
orderRouter.post("/sell", isAuthenticated, (req:AuthRequest,res)=>{
    try {
        pushToQueue("SELL_STOCK",{...req.body,userId:req.userId},res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
});
orderRouter.get("/getOrders",isAuthenticated,(req:AuthRequest,res)=>{
    try {
        pushToQueue("GET_ORDERS",req.userId,res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
})
orderRouter.get("/getSettledOrders",isAuthenticated,async(req:AuthRequest,res)=>{
    try {
        const orders = await prismaClient.order.findMany({
            where:{
                userId:req.userId
            }
        })
        console.log("first")
        res.status(200).send(orders)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
})
orderRouter.post("/cancel", isAuthenticated,(req,res)=>{
    try {
        pushToQueue("CANCEL",req.body,res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
});
orderRouter.post("/exit/:stockSymbol",isAuthenticated,(req:AuthRequest,res)=>{
    try {
        const {quantity,price,stockType} =req.body
        pushToQueue("EXIT",{stockSymbol:req.params.stockSymbol,userId:req.userId,quantity,price,stockType},res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
})
orderRouter.get("/:user",(req,res)=>{
    try {
        pushToQueue("getOrdersByUserId",req.params.user,res)
    } catch (error:any) {
        res.status(500).send(error?.message)
    }
})    
 
