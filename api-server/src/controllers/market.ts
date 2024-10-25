import { Request, Response } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import { prismaClient } from "../services/prisma";

export const createMarket = catchAsync(async (req: Request, res: Response) => {
  const { stockSymbol, title, description, startTime, endTime } = req.body;
  if (!stockSymbol || !title || !description || !startTime || !endTime) {
    sendResponse(res, 400, {
      message:
        "All fields (stockSymbol, title, description, startTime, endTime) are required",
      data: "",
    });
    return;
  }
  const existingStockSymbol = await prismaClient.stockSymbol.findUnique({
    where: { stockSymbol },
  });
  if (!existingStockSymbol) {
    sendResponse(res, 404, {
      message: "Stock symbol not found",
      data: "",
    });
    return;
  }

  const market = await prismaClient.market.create({
    data: {
      stockSymbol,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    },
  });

  return sendResponse(res, 201, {
    message: "Market created successfully",
    data: market,
  });
});
