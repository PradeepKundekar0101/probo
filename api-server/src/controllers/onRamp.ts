import { catchAsync, sendResponse } from "../utils/api.util";
import { Request, Response } from "express";
import { prismaClient } from "..";

export const onRampAmount = catchAsync(async (req: Request, res: Response) => {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
        sendResponse(res, 400, {
            message: "userId or amount not provided",
            data: null,
        });
        return;
    }
    const inrBalance = await prismaClient.inrBalance.findFirst({
        where: { userId },
    });
    if (!inrBalance) {
        return sendResponse(res, 404, {
            message: "INR balance not found",
            data: null,
        });
    }
    const updatedInrBalance = await prismaClient.inrBalance.update({
        where: { id: inrBalance.id },
        data: {
            balance: {
                increment: amount, 
            },
        },
    });

    return sendResponse(res, 200, {
        message: "Success",
        data: updatedInrBalance,
    });
});
