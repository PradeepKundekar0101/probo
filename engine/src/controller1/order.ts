import { Request, Response } from "express";
import {
  inrBalances,
  stockBalances,
  orderBook,
  markets,
  ordersList,
  currentMarketPrice
} from "../db";

import { catchAsync, sendResponse } from "../utils/api.util";
import { generateId } from "../utils/generateOrderId";
import { StockType } from "../db/types";

function updateCurrentMarketPrice(stockSymbol: string, stockType: StockType, price: number) {
  if (!currentMarketPrice[stockSymbol]) {
    currentMarketPrice[stockSymbol] = { yes: 0, no: 0 };
  } 
  if(stockType=="yes"){
    currentMarketPrice[stockSymbol]["yes"] = price;
    currentMarketPrice[stockSymbol]["no"] = 10 - price;
  }
  else{
    currentMarketPrice[stockSymbol]["yes"] = 10 - price;
    currentMarketPrice[stockSymbol]["no"] = price;
  }

}
interface RequestBody {
  userId: string;
  stockSymbol: string;
  quantity: string | number;
  price: string | number;
  stockType: StockType; 
}
export const buyStock = catchAsync(async (req: Request, res: Response) => {
  const reqBody: RequestBody = req.body;
  const buyerId: string = reqBody.userId;
  const stockSymbol: string = reqBody.stockSymbol;
  const quantity: number = Number(reqBody.quantity);
  const price: number = Number(reqBody.price);
  const stockType: StockType = reqBody.stockType as StockType;

  if (
    !buyerId ||
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
  
  if (!inrBalances[buyerId] || inrBalances[buyerId].balance < totalCost) {
    return sendResponse(res, 400, "Insufficient INR balance");
  }
  if (!stockBalances[buyerId]) {
    stockBalances[buyerId] = {};
  }
  if (!stockBalances[buyerId][stockSymbol]) {
    stockBalances[buyerId][stockSymbol] = {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 },
    };
  }
  let availableStocks: number = quantity;
  let totalTradeQty = 0;

  if (
    orderBook[stockSymbol]["direct"][stockType][price] &&
    orderBook[stockSymbol]["direct"][stockType][price].total > 0
  )
  {
    const orders = orderBook[stockSymbol]["direct"][stockType][price].orders;

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
      stockBalances[buyerId][stockSymbol][stockType as StockType].quantity += tradeQuantity;
      // Update orderbook
      orderBook[stockSymbol]["direct"][stockType][price].total -= tradeQuantity;
      orderBook[stockSymbol]["direct"][stockType][price].orders[sellerId] -= tradeQuantity;
      if ( orderBook[stockSymbol]["direct"][stockType][price].orders[sellerId] === 0)
      {
        delete orderBook[stockSymbol]["direct"][stockType as StockType][price].orders[sellerId];
      }
    }
    if (orderBook[stockSymbol]["direct"][stockType][price].total === 0)
    {
      delete orderBook[stockSymbol]["direct"][stockType][price];
    }
  }
  //settle the buyer
  // inrBalances[buyerId].locked += availableStocks * price
  if(availableStocks===0){
    inrBalances[buyerId].balance -= totalTradeQty * price;
    return sendResponse(res,200,`${totalTradeQty} qty traded directly`)
  }
  //now let's satisfy the pending reverse orders
  let leftOverStockAfterReverseMatching = availableStocks;
  const reverseStockType = stockType =="no"?"yes":"no"
  const reversePrice  = 1000 - price
  if (
    orderBook[stockSymbol].reverse[stockType] && 
    orderBook[stockSymbol].reverse[stockType][price] &&
    orderBook[stockSymbol]["reverse"][stockType][price].mint.remainingQty > 0
  ){
    const remainingQty = orderBook[stockSymbol].reverse[stockType][price].mint.remainingQty;
    const participants = orderBook[stockSymbol].reverse[stockType][price].mint.participants;
    if(leftOverStockAfterReverseMatching>=remainingQty){
        participants.forEach((p)=>{
          const stockTypeToAdd = p.type=="buy"? stockType==="no"?"yes":"no":stockType
          if(p.type=="buy"){
            inrBalances[p.userId].locked-= (p.price * p.quantity)
            stockBalances[p.userId][stockSymbol][stockTypeToAdd].quantity+= p.quantity
          }else{
            inrBalances[p.userId].balance+= ((price) * p.quantity)
            stockBalances[p.userId][stockSymbol][stockTypeToAdd].quantity+= p.quantity
          }
        })
        inrBalances[buyerId].balance-= remainingQty * price
        stockBalances[buyerId][stockSymbol][stockType].quantity+=remainingQty
        delete orderBook[stockSymbol].reverse[stockType][price]
        const stillLeft = leftOverStockAfterReverseMatching-remainingQty
        if(stillLeft>0){
          if (!orderBook[stockSymbol].reverse[reverseStockType])
            orderBook[stockSymbol].reverse[reverseStockType] = {  };
          if (!orderBook[stockSymbol].reverse[reverseStockType][reversePrice])
          {
            orderBook[stockSymbol].reverse[reverseStockType][reversePrice] = {
              total:0,
              mint: {
                participants: [],
                remainingQty: 0
              }
            };
          } 
          orderBook[stockSymbol].reverse[reverseStockType][reversePrice].total+=stillLeft;
          inrBalances[buyerId].locked+=stillLeft*price;
          inrBalances[buyerId].balance-=stillLeft*price;
          orderBook[stockSymbol].reverse[reverseStockType][reversePrice].mint.participants.push({
            userId:buyerId,
            quantity:stillLeft,
            price:price,
            type:"buy"
          })
          orderBook[stockSymbol].reverse[reverseStockType][reversePrice].mint.remainingQty+=stillLeft
        }
    }
    else
    {
      orderBook[stockSymbol].reverse[stockType][price].mint.participants.push({
        userId:buyerId,
        quantity:leftOverStockAfterReverseMatching,
        price:price,
        type:"sell"
      })
      
      inrBalances[buyerId].locked+=leftOverStockAfterReverseMatching*price;
      orderBook[stockSymbol].reverse[stockType][price].mint.remainingQty-=leftOverStockAfterReverseMatching
    }
    updateCurrentMarketPrice(stockSymbol,stockType,price)
    return sendResponse(res,200,`${ quantity - availableStocks} bought directly and ${availableStocks} in pending`)
  }
 

  if (!orderBook[stockSymbol].reverse[reverseStockType])
      orderBook[stockSymbol].reverse[reverseStockType] = {  };

  if (!orderBook[stockSymbol].reverse[reverseStockType][reversePrice])
  {
    orderBook[stockSymbol].reverse[reverseStockType][reversePrice] = {
      total:0,
      mint: {
        participants: [],
        remainingQty: 0
      }
    };
  } 
  orderBook[stockSymbol].reverse[reverseStockType][reversePrice].total+=leftOverStockAfterReverseMatching;
  inrBalances[buyerId].locked+=leftOverStockAfterReverseMatching*price;
  inrBalances[buyerId].balance-=leftOverStockAfterReverseMatching*price;
  orderBook[stockSymbol].reverse[reverseStockType][reversePrice].mint.participants.push({
    userId:buyerId,
    quantity:leftOverStockAfterReverseMatching,
    price:price,
    type:"buy"
  })
    orderBook[stockSymbol].reverse[reverseStockType][reversePrice].mint.remainingQty+=leftOverStockAfterReverseMatching
  updateCurrentMarketPrice(stockSymbol,stockType,price)
  return sendResponse(res, 200, {
    message: "Buy order processed successfully",
  });
});

export const sellStock = catchAsync(async (req: Request, res: Response) => {
  const reqBody: RequestBody = req.body;
  const sellerId: string = reqBody.userId;
  const stockSymbol: string = reqBody.stockSymbol;
  const quantity: number = Number(reqBody.quantity);
  const price: number = Number(reqBody.price);
  const stockType: StockType = reqBody.stockType as StockType;

  if ( !sellerId || !stockSymbol || !quantity || price === undefined || !stockType)
    return sendResponse(res, 400, "Missing parameters");

  if (!orderBook[stockSymbol]) 
    return res.status(404).json({ error: "Market not found" });

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
    orderBook[stockSymbol].direct[stockType][price] &&
    orderBook[stockSymbol].direct[stockType][price].total > 0
  ) {
    const orders = orderBook[stockSymbol].direct[stockType][price].orders;
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
      orderBook[stockSymbol].direct[stockType][price].total -= tradeQuantity;
      orderBook[stockSymbol].direct[stockType][price].orders[buyerId] -= tradeQuantity;
      updateCurrentMarketPrice(stockSymbol,stockType,price)
      if (orderBook[stockSymbol].direct[stockType][price].orders[buyerId] === 0) {
        delete orderBook[stockSymbol].direct[stockType][price].orders[buyerId];
      }
    }
    if ( orderBook[stockSymbol].direct[stockType][price].total === 0) {
      delete orderBook[stockSymbol].direct[stockType][price];
    }
  }
  //Lock the user's stock balance
  stockBalances[sellerId][stockSymbol][stockType as StockType].quantity -= availableStocks;
  stockBalances[sellerId][stockSymbol][stockType as StockType].locked += availableStocks;

  if (availableStocks > 0) {
    if (!orderBook[stockSymbol].direct[stockType as StockType][price]) {
      orderBook[stockSymbol].direct[stockType as StockType][price] = {
        total: availableStocks,
        orders: {
          [sellerId]: availableStocks,
        },
      };
    } else {
      orderBook[stockSymbol].direct[stockType as StockType][price].total += availableStocks;
      orderBook[stockSymbol].direct[stockType as StockType][price].orders[sellerId] += availableStocks;
    }
  }
  ordersList.push({
    id: generateId(),
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
  orderBook[stockSymbol].direct[stockType as StockType][price].total -= totalPrice;
  orderBook[stockSymbol].direct[stockType as StockType][price].orders[userId] -= totalPrice;
  if (
    orderBook[stockSymbol].direct[stockType as StockType][price].orders[userId] === 0
  ) {
    delete orderBook[stockSymbol].direct[stockType as StockType][price].orders[userId];
  }
  const index = ordersList.findIndex((order) => order.id === orderId);
  ordersList.splice(index, 1);
  return sendResponse(res, 200, { message: "Order cancelled" });
});


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
