import { Request, Response } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import { prismaClient } from "../services/prisma";
import { AuthRequest } from "../middleware/auth";
import { pushToQueue } from "../services/redis";

export const getInrBalanceByUserId =catchAsync(async(req:AuthRequest,res:Response)=>{
    const userId = req.userId
    if(!userId)
    {
        sendResponse(res,400,{
            message:"userId not provided",
            data:null
        })
        return;
    }
    // const inrBalance = await prismaClient.inrBalance.findFirst({
    //     where:{
    //         userId
    //     }
    // })
    // if(!inrBalance){
    //     return sendResponse(res,404,{
    //         message:"Inr balance not found",
    //         data:null
    //     })
    // }
    // return sendResponse(res,200,{
    //     message:"sucess",
    //     data: inrBalance
    // })
    pushToQueue("GET_INR_BALANCE",userId,res)
    
})
export const getStockBalanceByUserId =catchAsync(async(req:AuthRequest,res:Response)=>{
    const userId = req.userId
    if(!userId)
    {
        sendResponse(res,400,{
            message:"userId not provided",
            data:null
        })
        return;
    }
    // const stockBalance = await prismaClient.stockBalance.findFirst({
    //     where:{
    //         userId
    //     }
    // })
    // if(!stockBalance){
    //     return sendResponse(res,404,{
    //         message:"Stock balance not found",
    //         data:null
    //     })
    // }
    // return sendResponse(res,200,{
    //     message:"sucess",
    //     data: stockBalance
    // })
    pushToQueue("GET_STOCK_BALANCE",userId,res)
})