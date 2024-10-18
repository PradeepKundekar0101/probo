import { Request, Response } from "express";
import { markets, stockBalances, inrBalances, orderBook } from "../db";
import { Market, StockType } from "../types";
import { catchAsync, sendResponse } from "../utils/api.util";
export const createMarket = catchAsync(async (req: Request, res: Response) => {
  const {
    stockSymbol,
    title,
    description,
    startTime,
    endTime,
    initialYesTokens,
    initialNoTokens,
  } = req.body;

  if (markets[stockSymbol]) {
    return res.status(400).json({ error: "Market already exists" });
  }

  const market: Market = {
    stockSymbol,
    title,
    description,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    initialYesTokens,
    initialNoTokens,
    result: null,
  };

  markets[stockSymbol] = market;

  // Initialize market maker's stock balances
  const marketMakerId = "marketMaker";
  if (!stockBalances[marketMakerId]) {
    stockBalances[marketMakerId] = {};
  }
  stockBalances[marketMakerId][stockSymbol] = {
    yes: { quantity: initialYesTokens, locked: 0 },
    no: { quantity: initialNoTokens, locked: 0 },
  };

  // Initialize order book
  orderBook[stockSymbol] = {
    yes: {},
    no: {},
  };

  return sendResponse(res, 201, { data: "Market created successfully" });
});

export const settleMarket = catchAsync(async (req: Request, res: Response) => {
  const { stockSymbol, result } = req.body;

  if (!markets[stockSymbol]) {
    return res.status(404).json({ error: "Market not found" });
  }

  if (result !== "yes" && result !== "no") {
    return res.status(400).json({ error: "Invalid result" });
  }

  markets[stockSymbol].result = result as StockType;


  for (const userId in stockBalances) {
    const userStocks = stockBalances[userId][stockSymbol];
    if (userStocks) {
      const winningStocks = userStocks[result as StockType];
      const losingStocks = userStocks[result === "yes" ? "no" : "yes"];

      if (winningStocks && winningStocks.quantity > 0) {
        const payout = winningStocks.quantity * 1000; // 1000 paise = 10 INR
        if (!inrBalances[userId]) {
          inrBalances[userId] = { balance: 0, locked: 0 };
        }
        inrBalances[userId].balance += payout;
      }

      userStocks.yes = { quantity: 0, locked: 0 };
      userStocks.no = { quantity: 0, locked: 0 };
    }
  }

  delete orderBook[stockSymbol];
  res.status(200).json({ data: "done" });
});
