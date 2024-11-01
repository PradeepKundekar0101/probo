import { v4 as uuidv4 } from 'uuid';
import { GlobalData } from "../db";
import { OrderListItem } from "../types/orderList";


export const createOrderItem = (
  stockSymbol: string,
  stockType: "yes" | "no",
  userId: string,
  quantity: number,
  price: number,
  orderType: "buy" | "sell"
): OrderListItem => {
  const orderItem: OrderListItem = {
    id: uuidv4(),
    stockSymbol,
    stockType,
    createdAt: new Date().toISOString(),
    userId,
    quantity,
    price,
    orderType,
    totalPrice: quantity * price * 100, 
    status: "pending",
    tradedQuantity: 0
  };
  
  GlobalData.ordersList.push(orderItem);
  return orderItem;
};


export const updateOrderStatus = (
  orderId: string,
  newTradedQuantity: number
): void => {
  const orderItem = GlobalData.ordersList.find(order => order.id === orderId);
  
  if (!orderItem) return;
  
  orderItem.tradedQuantity = newTradedQuantity;
  orderItem.status =  getOrderStatus(orderItem.quantity, newTradedQuantity);
  
};


const getOrderStatus = (
  totalQuantity: number,
  tradedQuantity: number
): "pending" | "partial" | "completed" => {
  if (tradedQuantity === 0) return "pending";
  if (tradedQuantity === totalQuantity) return "completed";
  return "partial";
};


export const trackTrade = (
  buyOrderId: string,
  sellOrderId: string,
  tradedQuantity: number
): void => {
  const buyOrder = GlobalData.ordersList.find(order => order.id === buyOrderId);
  const sellOrder = GlobalData.ordersList.find(order => order.id === sellOrderId);
  
  if (buyOrder) {
    const newTradedQuantity = (buyOrder.tradedQuantity || 0) + tradedQuantity;
    updateOrderStatus(buyOrderId, newTradedQuantity);
  }
  
  if (sellOrder) {
    const newTradedQuantity = (sellOrder.tradedQuantity || 0) + tradedQuantity;
    updateOrderStatus(sellOrderId, newTradedQuantity);
  }
};


export const getRecentTrades = (
  stockSymbol: string,
  limit: number = 10
): OrderListItem[] => {
  return GlobalData.ordersList
    .filter(order => 
      order.stockSymbol === stockSymbol && 
      order.tradedQuantity > 0
    )
    .sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
};


export const getWeightedAveragePrice = (stockSymbol: string): number => {
  const recentTrades = getRecentTrades(stockSymbol);
  
  if (recentTrades.length === 0) return 5; 
  
  const { weightedSum, totalQuantity } = recentTrades.reduce(
    (acc, trade) => {
      const tradePrice = trade.stockType === "yes" ? 
        trade.price : 
        (10 - trade.price);
      
      return {
        weightedSum: acc.weightedSum + (tradePrice * trade.tradedQuantity),
        totalQuantity: acc.totalQuantity + trade.tradedQuantity
      };
    },
    { weightedSum: 0, totalQuantity: 0 }
  );
  
  return totalQuantity > 0 ? weightedSum / totalQuantity : 5;
};