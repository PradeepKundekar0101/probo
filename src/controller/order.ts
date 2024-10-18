// Updated Interfaces and Schemas
import { Request, Response, NextFunction, CookieOptions } from "express";

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);
};

export const sendResponse = (res: Response, statusCode: number, data: any) => {
  res.status(statusCode).json({
    status: "success",
    data,
  });
};

interface UserBalance {
  balance: number; // Available balance
  locked: number;  // Locked balance
}

interface InrBalances {
  [userId: string]: UserBalance;
}

interface OrderEntry {
  total: number;
  orders: {
    [userId: string]: number; // Quantity per user
  };
}

interface OrderBook {
  [symbol: string]: {
    yes: {
      [price: string]: OrderEntry;
    };
    no: {
      [price: string]: OrderEntry;
    };
  };
}

interface StockBalance {
  yes: {
    quantity: number; // Available quantity
    locked: number;    // Locked quantity
  };
  no: {
    quantity: number;
    locked: number;
  };
}

interface StockBalances {
  [userId: string]: {
    [stockSymbol: string]: StockBalance;
  };
}

// Global Variables (Mock Databases)
const INR_BALANCES: InrBalances = {};
const ORDERBOOK: OrderBook = {};
const STOCK_BALANCES: StockBalances = {};

// Helper Functions
function isMarketOpen(stockSymbol: string): boolean {
  // Implement market open logic based on startTime and endTime
  return true; // Placeholder
}



// Buy Stock Controller
export const buyStock = catchAsync(async (req: Request, res: Response) => {
  const {
    userId,
    stockSymbol,
    quantity,
    price,
    stockType,
  }: {
    userId: string;
    stockSymbol: string;
    quantity: number;
    price: number; // Price in paise
    stockType: "yes" | "no";
  } = req.body;

  if (!isMarketOpen(stockSymbol)) {
    return sendResponse(res, 400, { message: "Market is closed" });
  }

  const totalCost = quantity * price;

  // Validate User Balance
  if (!INR_BALANCES[userId]) {
    return sendResponse(res, 404, { message: "User not found" });
  }
  if (INR_BALANCES[userId].balance < totalCost) {
    return sendResponse(res, 400, { message: "Insufficient balance" });
  }

  // Initialize User Stock Balance if not exists
  if (!STOCK_BALANCES[userId]) {
    STOCK_BALANCES[userId] = {};
  }
  if (!STOCK_BALANCES[userId][stockSymbol]) {
    STOCK_BALANCES[userId][stockSymbol] = {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 },
    };
  }

  // Initialize OrderBook for the symbol if not exists
  if (!ORDERBOOK[stockSymbol]) {
    ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
  }

  const oppositeStockType = stockType === "yes" ? "no" : "yes";
  const oppositePrice = 1000 - price; // Total price is 1000 paise (Rs.10)

  let remainingQuantity = quantity;

  // Attempt to Match with Existing Sell Orders
  const sellOrders = ORDERBOOK[stockSymbol][oppositeStockType];
  const priceLevels = Object.keys(sellOrders)
    .map(Number)
    .sort((a, b) => (stockType === "yes" ? a - b : b - a)); // Ascending for 'yes', Descending for 'no'

  for (const sellPrice of priceLevels) {
    if (
      (stockType === "yes" && sellPrice <= oppositePrice) ||
      (stockType === "no" && sellPrice >= oppositePrice)
    ) {
      const orderEntry = sellOrders[sellPrice.toString()];
      const availableQuantity = orderEntry.total;

      const tradeQuantity = Math.min(remainingQuantity, availableQuantity);

      // Update Buyer Stock Balance
      STOCK_BALANCES[userId][stockSymbol][stockType].quantity += tradeQuantity;

      // Update Seller Stock Balance and INR Balance
      for (const sellerId in orderEntry.orders) {
        const sellerQuantity = orderEntry.orders[sellerId];
        const tradeQty = Math.min(tradeQuantity, sellerQuantity);

        // Update Seller's Stock Balance
        STOCK_BALANCES[sellerId][stockSymbol][oppositeStockType].locked -= tradeQty;

        // Update Seller's INR Balance
        const sellerProceeds = tradeQty * sellPrice;
        INR_BALANCES[sellerId].balance += sellerProceeds;

        // Update Order Entry
        orderEntry.orders[sellerId] -= tradeQty;
        if (orderEntry.orders[sellerId] === 0) {
          delete orderEntry.orders[sellerId];
        }

        // Update Variables
        orderEntry.total -= tradeQty;
        remainingQuantity -= tradeQty;

        if (remainingQuantity === 0) break;
      }

      // Remove Price Level if Empty
      if (orderEntry.total === 0) {
        delete sellOrders[sellPrice.toString()];
      }

      if (remainingQuantity === 0) break;
    }
  }

  // If Not Fully Matched, Create Reverse Sell Order
  if (remainingQuantity > 0) {
    // Lock Buyer's INR Balance for the remaining quantity
    const lockedAmount = remainingQuantity * price;
    INR_BALANCES[userId].balance -= lockedAmount;
    INR_BALANCES[userId].locked += lockedAmount;

    // Create Reverse Sell Order
    const reverseSellPrice = oppositePrice;

    // Lock Buyer's Future Stocks (Will be minted after reverse order is matched)
    STOCK_BALANCES[userId][stockSymbol][stockType].locked += remainingQuantity;

    // Add Reverse Sell Order to OrderBook
    if (!ORDERBOOK[stockSymbol][oppositeStockType][reverseSellPrice.toString()]) {
      ORDERBOOK[stockSymbol][oppositeStockType][reverseSellPrice.toString()] = {
        total: 0,
        orders: {},
      };
    }

    const reverseOrderEntry = ORDERBOOK[stockSymbol][oppositeStockType][reverseSellPrice.toString()];
    reverseOrderEntry.total += remainingQuantity;
    reverseOrderEntry.orders[userId] = (reverseOrderEntry.orders[userId] || 0) + remainingQuantity;
  } else {
    // Deduct Buyer's INR Balance
    INR_BALANCES[userId].balance -= totalCost;
  }

  return sendResponse(res, 200, { message: "Buy order placed successfully" });
});

// Sell Stock Controller
export const sellStock = catchAsync(async (req: Request, res: Response) => {
  const {
    userId,
    stockSymbol,
    quantity,
    price,
    stockType,
  }: {
    userId: string;
    stockSymbol: string;
    quantity: number;
    price: number;
    stockType: "yes" | "no";
  } = req.body;

  if (!isMarketOpen(stockSymbol)) {
    return sendResponse(res, 400, { message: "Market is closed" });
  }

  // Validate User Stock Balance
  if (
    !STOCK_BALANCES[userId] ||
    !STOCK_BALANCES[userId][stockSymbol] ||
    STOCK_BALANCES[userId][stockSymbol][stockType].quantity < quantity
  ) {
    return sendResponse(res, 400, { message: "Insufficient stock balance" });
  }

  // Initialize OrderBook for the symbol if not exists
  if (!ORDERBOOK[stockSymbol]) {
    ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
  }

  // Lock Seller's Stocks
  STOCK_BALANCES[userId][stockSymbol][stockType].quantity -= quantity;
  STOCK_BALANCES[userId][stockSymbol][stockType].locked += quantity;

  // Add Sell Order to OrderBook
  if (!ORDERBOOK[stockSymbol][stockType][price.toString()]) {
    ORDERBOOK[stockSymbol][stockType][price.toString()] = {
      total: 0,
      orders: {},
    };
  }

  const orderEntry = ORDERBOOK[stockSymbol][stockType][price.toString()];
  orderEntry.total += quantity;
  orderEntry.orders[userId] = (orderEntry.orders[userId] || 0) + quantity;

  return sendResponse(res, 200, { message: "Sell order placed successfully" });
});
