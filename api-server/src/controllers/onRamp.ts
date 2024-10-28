import { catchAsync, sendResponse } from "../utils/api.util";
import { Request, Response } from "express";
import { prismaClient } from "../services/prisma";
import { pushToQueue } from "../services/redis";
import { AuthRequest } from "../middleware/auth";

export const onRampAmount = catchAsync(async (req: AuthRequest, res: Response) => {
    const {  amount } = req.body;
    const userId = req.userId
    if ( !amount) {
        sendResponse(res, 400, {
            message: "userId or amount not provided",
            data: null,
        });
        return;
    }
    // const inrBalance = await prismaClient.inrBalance.findFirst({
    //     where: { userId },
    // });
    // if (!inrBalance) {
    //     return sendResponse(res, 404, {
    //         message: "INR balance not found",
    //         data: null,
    //     });
    // }
    // const updatedInrBalance = await prismaClient.inrBalance.update({
    //     where: { id: inrBalance.id },
    //     data: {
    //         balance: {
    //             increment: amount, 
    //         },
    //     },
    // });
    // console.log({userId,amount})
    pushToQueue("ONRAMP",{userId,amount},res)


    // return sendResponse(res, 200, {
    //     message: "Success",
    //     data: updatedInrBalance,
    // });
});
