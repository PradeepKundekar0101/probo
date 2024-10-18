
import { Request, Response } from 'express';
import { 
  inrBalances, 
  stockBalances, 
  orderBook, 
  markets, 
  lastTradedPrices 
} from '../db';
import { OrderEntry, StockType } from '../types';
import { generateOrderId } from '../utils/generateOrderId';
import { catchAsync, sendResponse } from '../utils/api.util';
import AppError from '../utils/AppError';

export const buyStock = catchAsync(async (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  if (!userId || !stockSymbol || !quantity || price === undefined || !stockType) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  if (!markets[stockSymbol]) {
    return res.status(404).json({ error: 'Market not found' });
  }

  const totalCost = quantity * price;

  if (!inrBalances[userId] || inrBalances[userId].balance < totalCost) {
    return res.status(400).json({ error: 'Insufficient INR balance' });
  }

  // Lock the funds
  inrBalances[userId].balance -= totalCost;
  inrBalances[userId].locked += totalCost;

  // Try to match with existing sell orders
  const remainingQuantity = matchBuyOrder(stockSymbol, stockType as StockType, quantity, price, userId);

  if (remainingQuantity > 0) {
    // If there are remaining stocks to buy, refund the unused amount
    const refundAmount = (quantity - remainingQuantity) * price;
    inrBalances[userId].locked -= refundAmount;
    inrBalances[userId].balance += refundAmount;
  }
  return sendResponse(res, 200, { message: 'Buy order processed successfully', 
    purchasedQuantity: quantity - remainingQuantity,
    remainingQuantity  });
});


export const sellStock = catchAsync(async (req: Request, res: Response) => {
  const { userId, stockSymbol, quantity, price, stockType } = req.body;

  if (!userId || !stockSymbol || !quantity || price === undefined || !stockType) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  if (!markets[stockSymbol]) {
    return res.status(404).json({ error: 'Market not found' });
  }

  if (!stockBalances[userId] || !stockBalances[userId][stockSymbol] || 
      stockBalances[userId][stockSymbol][stockType as StockType].quantity < quantity) {
    return res.status(400).json({ error: 'Insufficient stock balance' });
  }

  // Lock the stocks
  stockBalances[userId][stockSymbol][stockType as StockType].quantity -= quantity;
  stockBalances[userId][stockSymbol][stockType as StockType].locked += quantity;

  const orderId = generateOrderId();
  const order: OrderEntry = {
    orderId,
    userId,
    quantity,
    price,
    timestamp: new Date().toISOString()
  };

  // Add order to the order book
  if (!orderBook[stockSymbol]) {
    orderBook[stockSymbol] = { yes: {}, no: {} };
  }
  if (!orderBook[stockSymbol][stockType as StockType][price]) {
    //@ts-ignore
    orderBook[stockSymbol][stockType as StockType][price] = [];
  }
  orderBook[stockSymbol][stockType as StockType][price].push(order);
  return sendResponse(res, 200, { data: "Sell order placed successfully" });
});




export const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const { userId, orderId, stockSymbol, stockType, price } = req.body;

  if (!userId || !orderId || !stockSymbol || !stockType || price === undefined) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const orderList = orderBook[stockSymbol][stockType as StockType][price].orders;
  const orderIndex = orderList.findIndex(order => order.orderId === orderId && order.userId === userId);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orderList[orderIndex];
  orderList.splice(orderIndex, 1);
  orderBook[stockSymbol][stockType as StockType][price].total -= order.quantity;

  // Unlock balances
  if (stockType === 'yes') {
    inrBalances[userId].locked -= order.quantity * order.price;
    inrBalances[userId].balance += order.quantity * order.price;
  } else {
    stockBalances[userId][stockSymbol][stockType as "no" | "yes"].locked -= order.quantity;
    stockBalances[userId][stockSymbol][stockType as "no" | "yes"].quantity += order.quantity;
  }
  return sendResponse(res,200,{message:"Order cancelled"})
});

function matchBuyOrder(stockSymbol: string, stockType: StockType, quantity: number, maxPrice: number, buyerId: string): number {
  let remainingQuantity = quantity;

  if (!orderBook[stockSymbol] || !orderBook[stockSymbol][stockType]) {
    return remainingQuantity;
  }

  const relevantPrices = Object.keys(orderBook[stockSymbol][stockType])
    .map(Number)
    .filter(price => price <= maxPrice)
    .sort((a, b) => a - b);

  for (const price of relevantPrices) {
    const orders = orderBook[stockSymbol][stockType][price];
    
    while (orders.length > 0 && remainingQuantity > 0) {
      const order = orders[0];
      const tradeQuantity = Math.min(remainingQuantity, order.quantity);

      executeTrade(buyerId, order.userId, stockSymbol, tradeQuantity, price, stockType);

      remainingQuantity -= tradeQuantity;
      order.quantity -= tradeQuantity;

      if (order.quantity === 0) {
        orders.shift();
      }
    }

    if (orders.length === 0) {
      delete orderBook[stockSymbol][stockType][price];
    }

    if (remainingQuantity === 0) break;
  }

  return remainingQuantity;
}

function executeTrade(buyerId: string, sellerId: string, stockSymbol: string, quantity: number, price: number, stockType: StockType) {
  const totalPrice = quantity * price;

  // Update buyer's balances
  inrBalances[buyerId].locked -= totalPrice;
  if (!stockBalances[buyerId][stockSymbol]) {
    stockBalances[buyerId][stockSymbol] = { yes: { quantity: 0, locked: 0 }, no: { quantity: 0, locked: 0 } };
  }
  stockBalances[buyerId][stockSymbol][stockType].quantity += quantity;

  // Update seller's balances
  inrBalances[sellerId].balance += totalPrice;
  stockBalances[sellerId][stockSymbol][stockType].locked -= quantity;

  // Update last traded price
  lastTradedPrices[stockSymbol] = { ...lastTradedPrices[stockSymbol], [stockType]: price };
}