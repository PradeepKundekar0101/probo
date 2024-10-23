import { OrderBook } from "../db/types";
import { orderBook } from "../db";

export const parsedOrderBook = (): { [price: number]: number } => {
  const sellOrders: { [price: number]: number } = {};

  Object.values(orderBook).forEach((marketData) => {
    // Process reverse orders
    Object.entries(marketData.reverse).forEach(([outcome, orders]) => {
      Object.entries(orders).forEach(([price, orderData]) => {
        const numericPrice = Number(price);
        sellOrders[numericPrice] = (sellOrders[numericPrice] || 0) + orderData.mint.remainingQty;
      });
    });

    // Process direct orders
    Object.entries(marketData.direct).forEach(([outcome, orders]) => {
      Object.entries(orders).forEach(([price, orderEntry]) => {
        const numericPrice = Number(price);
        sellOrders[numericPrice] = (sellOrders[numericPrice] || 0) + orderEntry.total;
      });
    });
  });

  return sellOrders;
};