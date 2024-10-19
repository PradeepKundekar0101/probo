import { Request, Response } from "express";
import {
  inrBalances,
  stockBalances,
  orderBook,
  markets,
  ordersList,
  currentMarketPrice,
} from "../db";

import { catchAsync, sendResponse } from "../utils/api.util";
import { generateOrderId } from "../utils/generateOrderId";
import { StockType } from "../db/types";
import { rooms } from "..";

export const buyStock = catchAsync(async (req: Request, res: Response) => {
  let { userId, stockSymbol, quantity, price, stockType } = req.body;
  quantity = Number(quantity);
  price = Number(price);
  if (
    !userId ||
    !stockSymbol ||
    !quantity ||
    price === undefined ||
    !stockType
  ) {
    return sendResponse(res, 400, "Missing parameter");
  }
  if (!orderBook[stockSymbol]) {
    return sendResponse(res, 404, "Market not found");
  }
  const totalCost = quantity * price;

  if (!inrBalances[userId] || inrBalances[userId].balance < totalCost) {
    return sendResponse(res, 400, "Insufficient INR balance");
  }
  if (!stockBalances[userId]) {
    stockBalances[userId] = {};
  }
  if (!stockBalances[userId][stockSymbol]) {
    stockBalances[userId][stockSymbol] = {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 },
    };
  }
  let availableStocks: number = quantity;
  let totalTradeQty = 0;
  const isLimitOrder =
    currentMarketPrice[stockSymbol][stockType as StockType] !== price;

  if (
    orderBook[stockSymbol]["sell"][stockType as StockType][price] &&
    orderBook[stockSymbol]["sell"][stockType as StockType][price].total > 0
  ) {
    const orders =
      orderBook[stockSymbol]["sell"][stockType as StockType][price].orders;

    for (const sellerId in orders) {
      if (availableStocks === 0) break;
      const sellerQuantity = orders[sellerId];
      const tradeQuantity = Number(Math.min(availableStocks, sellerQuantity));
      // Execute the trade
      totalTradeQty += tradeQuantity;
      availableStocks -= tradeQuantity;
      // Update seller's balances
      inrBalances[sellerId].balance += tradeQuantity * price;
      stockBalances[sellerId][stockSymbol][stockType as StockType].locked -= tradeQuantity;
      // Update buyer's stock balance
      stockBalances[userId][stockSymbol][stockType as StockType].quantity += tradeQuantity;
      // Update orderbook
      orderBook[stockSymbol]["sell"][stockType as StockType][price].total -= tradeQuantity;
      orderBook[stockSymbol]["sell"][stockType as StockType][price].orders[sellerId] -= tradeQuantity;
      if ( orderBook[stockSymbol]["sell"][stockType as StockType][price].orders[sellerId] === 0)
      {
        delete orderBook[stockSymbol]["sell"][stockType as StockType][price].orders[sellerId];
      }
    }

    if (orderBook[stockSymbol]["sell"][stockType as StockType][price].total === 0) {
      delete orderBook[stockSymbol]["sell"][stockType as StockType][price];
    }
  }
  if (availableStocks > 0) {
    if (isLimitOrder) {
      stockBalances[userId][stockSymbol][stockType as StockType].quantity +=
        totalTradeQty;
      inrBalances[userId].locked += availableStocks * price;
    } else {
      stockBalances[userId][stockSymbol][stockType as StockType].quantity +=
        availableStocks;

      if (availableStocks > markets[stockSymbol][stockType as StockType]) {
        mintNewTokens(
          stockSymbol,
          stockType,
          availableStocks - markets[stockSymbol][stockType as StockType]
        );
      }

      markets[stockSymbol][stockType as StockType] -= availableStocks;
    }
  }
  inrBalances[userId].balance -= totalCost;
  if (isLimitOrder) {
    if (!orderBook[stockSymbol]["buy"]) {
      orderBook[stockSymbol]["buy"] = {
        yes: {},
        no: {},
      };
    }
    if (!orderBook[stockSymbol]["buy"][stockType as StockType][price]) {
      orderBook[stockSymbol]["buy"][stockType as StockType][price] = {
        total: quantity,
        orders: {
          [userId]: quantity,
        },
      };
    } else {
      orderBook[stockSymbol]["buy"][stockType as StockType][price].total +=
        quantity;
      orderBook[stockSymbol]["buy"][stockType as StockType][price].orders[
        userId
      ] = quantity;
    }
  }

  ordersList.push({
    id: generateOrderId(),
    userId,
    price,
    createdAt: new Date(),
    quantity,
    stockSymbol,
    stockType,
    totalPrice: price * quantity,
    orderType: "buy",
    status: "executed",
  });
  const clients = rooms.get(stockSymbol);
  clients?.forEach((client) => {
    client.send(JSON.stringify(orderBook));
  });
  return sendResponse(res, 200, {
    message: "Buy order processed successfully",
  });
});

export const sellStock = catchAsync(async (req: Request, res: Response) => {
  let { userId: sellerId, stockSymbol, quantity, price, stockType } = req.body;
  quantity = Number(quantity);
  price = Number(price);
  if (
    !sellerId ||
    !stockSymbol ||
    !quantity ||
    price === undefined ||
    !stockType
  ) {
    return sendResponse(res, 400, "Missing parameters");
  }

  if (!orderBook[stockSymbol]) {
    return res.status(404).json({ error: "Market not found" });
  }

  if (
    !stockBalances[sellerId] ||
    !stockBalances[sellerId][stockSymbol] ||
    stockBalances[sellerId][stockSymbol][stockType as StockType].quantity <
      quantity
  ) {
    return res.status(400).json({ error: "Insufficient stock balance" });
  }
  let availableStocks = quantity;
  let totalTradeQty = 0;
  if (
    orderBook[stockSymbol]["buy"][stockType as StockType][price] &&
    orderBook[stockSymbol]["buy"][stockType as StockType][price].total > 0
  ) {
    const orders =
      orderBook[stockSymbol]["buy"][stockType as StockType][price].orders;

    for (const buyerId in orders) {
      if (availableStocks === 0) break;
      const sellerQuantity = orders[buyerId];
      const tradeQuantity = Math.min(availableStocks, sellerQuantity);
      // Execute the trade
      totalTradeQty += tradeQuantity;
      availableStocks -= tradeQuantity;
      // Update seller's balances
      inrBalances[buyerId].locked -= tradeQuantity * price;
      stockBalances[buyerId][stockSymbol][stockType as StockType].quantity +=
        tradeQuantity;
      // Update seller's stock balance
      stockBalances[sellerId][stockSymbol][stockType as StockType].quantity -=
        tradeQuantity;
      // Update orderbook
      orderBook[stockSymbol]["buy"][stockType as StockType][price].total -=
        tradeQuantity;
      orderBook[stockSymbol]["buy"][stockType as StockType][price].orders[
        buyerId
      ] -= tradeQuantity;
      if (
        orderBook[stockSymbol]["buy"][stockType as StockType][price].orders[
          buyerId
        ] === 0
      ) {
        delete orderBook[stockSymbol]["buy"][stockType as StockType][price]
          .orders[buyerId];
      }
    }
    if (
      orderBook[stockSymbol]["buy"][stockType as StockType][price].total === 0
    ) {
      delete orderBook[stockSymbol]["buy"][stockType as StockType][price];
    }
  }
  //Lock the user's stock balance
  stockBalances[sellerId][stockSymbol][stockType as StockType].quantity -=
    availableStocks;
  stockBalances[sellerId][stockSymbol][stockType as StockType].locked +=
    availableStocks;
  console.log(availableStocks);
  if (availableStocks > 0) {
    if (!orderBook[stockSymbol]["sell"][stockType as StockType][price]) {
      orderBook[stockSymbol]["sell"][stockType as StockType][price] = {
        total: availableStocks,
        orders: {
          [sellerId]: availableStocks,
        },
      };
    } else {
      orderBook[stockSymbol]["sell"][stockType as StockType][price].total +=
        availableStocks;
      orderBook[stockSymbol]["sell"][stockType as StockType][price].orders[
        sellerId
      ] += availableStocks;
    }
  }
  ordersList.push({
    id: generateOrderId(),
    userId: sellerId,
    price,
    createdAt: new Date(),
    quantity: availableStocks,
    stockSymbol,
    stockType,
    totalPrice: price * availableStocks,
    orderType: "sell",
    status: "executed",
  });
  return sendResponse(res, 200, { data: "Sell order placed successfully" });
});

export const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (orderId === undefined) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  const order = ordersList.filter((order) => order.id == orderId);
  if (order.length == 0) return sendResponse(res, 404, "Order not found");
  if (order[0].orderType == "buy") {
    return sendResponse(res, 400, "Cannot cancel buy orders");
  }
  const { userId, price, stockSymbol, stockType, quantity, totalPrice } =
    order[0];
  orderBook[stockSymbol]["sell"][stockType as StockType][price].total -=
    totalPrice;
  orderBook[stockSymbol]["sell"][stockType as StockType][price].orders[
    userId
  ] -= totalPrice;
  if (
    orderBook[stockSymbol]["sell"][stockType as StockType][price].orders[
      userId
    ] === 0
  ) {
    delete orderBook[stockSymbol]["sell"][stockType as StockType][price].orders[
      userId
    ];
  }
  const index = ordersList.findIndex((order) => order.id === orderId);
  ordersList.splice(index, 1);
  return sendResponse(res, 200, { message: "Order cancelled" });
});

export const mintNewTokens = (
  stockSymbol: string,
  stockType: string,
  quantity: number
) => {
  markets[stockSymbol][stockType as StockType] += quantity;
};

export const getOrderByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = req.params;
    if (user === undefined) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    const orders = ordersList.filter((order) => order.userId == user);
    return sendResponse(res, 200, { data: orders });
  }
);
