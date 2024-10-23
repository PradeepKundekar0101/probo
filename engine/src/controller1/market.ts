import { Request, Response } from "express";
import {  stockBalances, inrBalances, orderBook, markets, currentMarketPrice } from "../db";
import { Market, StockType } from "../db/types";
import { catchAsync, sendResponse } from "../utils/api.util";

export const createMarket = catchAsync(async (req: Request, res: Response) => {
  const {
    stockSymbol,
    title,
    description,
    startTime,
    endTime,
  } = req.body;

  if (orderBook[stockSymbol]) {
    return res.status(400).json({ error: "Market already exists" });
  }

  const market: Market = {
    stockSymbol,
    title,
    description,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    result: null,
  };
  markets[stockSymbol] = market;
  orderBook[stockSymbol] = {
    direct: {
      yes: {},
      no: {}
    },
    reverse: {
      yes: {},
      no: {},
      
    }
  };
  currentMarketPrice[stockSymbol]={
    yes:500,
    no:500
  }
 

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
        const payout = winningStocks.quantity * 1000; 
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


// export const getMarketPrice = catchAsync(async (req: Request, res: Response) => {
//   const { stockSymbol } = req.params;
//   console.log(markets)
//   console.log(stockSymbol)
//   if (!markets[stockSymbol]) {
//     return sendResponse(res, 404, "Market not found");
//   }
  
//   const marketPrice = calculateMarketPrice(stockSymbol, orderBook);
//   currentMarketPrice[stockSymbol] = marketPrice;
  
//   return sendResponse(res, 200, marketPrice);
// });