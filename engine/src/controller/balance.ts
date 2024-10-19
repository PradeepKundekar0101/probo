import { Response, Request } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import { inrBalances, stockBalances } from "../db";
import AppError from "../utils/AppError";

export const getBalance = catchAsync(async (req: Request, res: Response) => {
  const balance = inrBalances;
  const userId = req.params.userId;
  if (!balance[userId]) {
    throw new AppError(404, "User not found");
  }
  return sendResponse(res, 200, { data: balance[userId] });
});

export const getBalanceAll = catchAsync(async (req: Request, res: Response) => {
  const balance = inrBalances;
  return sendResponse(res, 200, { data: balance });
});
export const getStockBalance = catchAsync(
  async (req: Request, res: Response) => {
    const balance = stockBalances;
    const userId = req.params.userId;
    if (!inrBalances[userId]) {
      return sendResponse(res, 404, { data: "User not found" });
    }
    if (!balance[userId]) {
      return sendResponse(res, 200, { data: {} });
    }
    return sendResponse(res, 200, { data: balance[userId] });
  }
);
export const getStockBalanceAll = catchAsync(
  async (req: Request, res: Response) => {
    const balance = stockBalances;

    return sendResponse(res, 200, { data: balance });
  }
);
