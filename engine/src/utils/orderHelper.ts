import { GlobalData } from "../db/index";

import { v4 as uuidv4 } from 'uuid';
import { OrderListItem } from "../types/orderList";
import { createOrderItem, trackTrade, updateOrderStatus } from "./orderTrackingHelper";


export const validateOrder = (
  userId: string,
  quantity: number,
  price: number
): boolean => {
  if (!GlobalData.inrBalances[userId]) return false;
  if (GlobalData.inrBalances[userId].balance < quantity * price || price <= 0)
    return false;
  return true;
};

export const initializeStockBalance = (userId: string, stockSymbol: string) => {
  if (!GlobalData.stockBalances[userId]) {
    GlobalData.stockBalances[userId] = {};
  }
  if (!GlobalData.stockBalances[userId][stockSymbol]) {
    GlobalData.stockBalances[userId][stockSymbol] = {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 },
    };
  }
};

export const mintOppositeStock = (
  stockSymbol: string,
  price: number,
  quantity: number,
  userId: number | string,
  orderType: "yes" | "no"
) => {
  const oppositePrice = 10 - price;

  if (orderType === "yes") {
    if (!GlobalData.orderBook[stockSymbol].no[oppositePrice]) {
      GlobalData.orderBook[stockSymbol].no[oppositePrice] = {
        total: 0,
        orders: {},
      };
    }
    GlobalData.orderBook[stockSymbol].no[oppositePrice].total += quantity;
    GlobalData.orderBook[stockSymbol].no[oppositePrice].orders[userId] = {
      type: "reversed",
      quantity:
        (GlobalData.orderBook[stockSymbol].no[oppositePrice].orders[userId]
          ?.quantity || 0) + quantity,
    };
  } else {
    if (!GlobalData.orderBook[stockSymbol].yes[oppositePrice]) {
      GlobalData.orderBook[stockSymbol].yes[oppositePrice] = {
        total: 0,
        orders: {},
      };
    }
    GlobalData.orderBook[stockSymbol].yes[oppositePrice].total += quantity;
    GlobalData.orderBook[stockSymbol].yes[oppositePrice].orders[userId] = {
      type: "reversed",
      quantity:
        (GlobalData.orderBook[stockSymbol].yes[oppositePrice].orders[userId]
          ?.quantity || 0) + quantity,
    };
  }
};

export const buy = (
  userId: string,
  stockSymbol: string,
  quantity: number,
  price: number,
  stockType:"yes"|"no"
) => {
  if (!validateOrder(userId, quantity, price)) {
    return { error: "Invalid order" };
  }

  if (!GlobalData.orderBook[stockSymbol]) {
    return { error: "Invalid stock symbol" };
  }
  GlobalData.inrBalances[userId].balance -= quantity * price * 100;
  GlobalData.inrBalances[userId].locked += quantity * price * 100;

  const reverseStockType = stockType =="yes"?"no":"yes"
  let availableQuantity = 0;
  let availableReverseQuantity = 0;
  if (GlobalData.orderBook[stockSymbol][stockType][price]) {
    availableQuantity = GlobalData.orderBook[stockSymbol][stockType][price].total;
    availableReverseQuantity = GlobalData.orderBook[stockSymbol][reverseStockType][10 - price]?.total || 0;
  }

  let tempQuantity = quantity;
  let tradedQuantity = 0;


  const orderItem = createOrderItem(
    stockSymbol,
    stockType,
    userId,
    quantity,
    price,
    "buy"
  );
  
  GlobalData.ordersList.push(orderItem);

  if (availableQuantity > 0) {
    for (let user in GlobalData.orderBook[stockSymbol][stockType][price].orders) {
      if (tempQuantity <= 0) break;

      const available = GlobalData.orderBook[stockSymbol][stockType][price].orders[user].quantity;
      const toTake = Math.min(available, tempQuantity);

      GlobalData.orderBook[stockSymbol][stockType][price].orders[user].quantity -= toTake;
      GlobalData.orderBook[stockSymbol][stockType][price].total -= toTake;
      tempQuantity -= toTake;
      tradedQuantity += toTake;


      updateOrderStatus(orderItem.id, tradedQuantity);

      if (GlobalData.orderBook[stockSymbol][stockType][price].orders[user].type == "sell" ) {
        const matchingSellOrder = GlobalData.ordersList.find(
          order => order.userId === user && 
                  order.stockType === stockType && 
                  order.price === price &&
                  order.orderType === "sell" &&
                  order.status !== "completed"
        );
        if (matchingSellOrder) {
          trackTrade(orderItem.id, matchingSellOrder.id, toTake);
        }
        if (GlobalData.stockBalances[user][stockSymbol][stockType]) {
          GlobalData.stockBalances[user][stockSymbol][stockType].locked -= toTake;
          GlobalData.inrBalances[user].balance += toTake * price;
        }
      } else if (
        GlobalData.orderBook[stockSymbol][stockType][price].orders[user].type == "reversed"
      ) {
        if (GlobalData.stockBalances[user][stockSymbol][reverseStockType]) {
          GlobalData.stockBalances[user][stockSymbol][reverseStockType].quantity += toTake;
          GlobalData.inrBalances[user].locked -= toTake * price;
        }
      }

      if (
        GlobalData.orderBook[stockSymbol][stockType][price].orders[user].quantity === 0
      ) {
        delete GlobalData.orderBook[stockSymbol][stockType][price].orders[user];
      }
    }

    if (GlobalData.orderBook[stockSymbol][stockType][price].total === 0) {
      delete GlobalData.orderBook[stockSymbol][stockType][price];
    }
  }

  if (
    availableReverseQuantity > 0 &&
    GlobalData.orderBook[stockSymbol][reverseStockType][10 - price]
  ) {
    for (let user in GlobalData.orderBook[stockSymbol][reverseStockType][10 - price].orders) {
      if (tempQuantity <= 0) break;

      const available =
        GlobalData.orderBook[stockSymbol][reverseStockType][10 - price].orders[user].quantity;
      const toTake = Math.min(available, tempQuantity);

      GlobalData.orderBook[stockSymbol][reverseStockType][10 - price].orders[user].quantity -=
        toTake;
      GlobalData.orderBook[stockSymbol][reverseStockType][10 - price].total -= toTake;
      tempQuantity -= toTake;
      tradedQuantity += toTake;

      // Update order status
      updateOrderStatus(orderItem.id, tradedQuantity);

      if (
        GlobalData.orderBook[stockSymbol][reverseStockType][10 - price].orders[user].type ==
        "sell"
      ) {

        const matchingSellOrder = GlobalData.ordersList.find(
          order => order.userId === user && 
                  order.stockType === stockType && 
                  order.price === 10 - price &&
                  order.orderType === "sell" &&
                  order.status !== "completed"
        );
        if (matchingSellOrder) {
          trackTrade(orderItem.id, matchingSellOrder.id, toTake);
        }
        if (GlobalData.stockBalances[user][stockSymbol][reverseStockType]) {
          GlobalData.stockBalances[user][stockSymbol][reverseStockType].locked -= toTake;
          GlobalData.inrBalances[user].balance += toTake * (10 - price);
        }
      } else if (
        GlobalData.orderBook[stockSymbol][reverseStockType][10 - price].orders[user].type ==
        "reversed"
      ) {
        if (GlobalData.stockBalances[user][stockSymbol][stockType]) {
          GlobalData.stockBalances[user][stockSymbol][stockType].quantity += toTake;
          GlobalData.inrBalances[user].locked -= toTake * (10 - price);
        }
      }

      if (
        GlobalData.orderBook[stockSymbol][reverseStockType][10 - price].orders[user]
          .quantity === 0
      ) {
        delete GlobalData.orderBook[stockSymbol][reverseStockType][10 - price].orders[user];
      }
    }

    if (GlobalData.orderBook[stockSymbol][reverseStockType][10 - price].total === 0) {
      delete GlobalData.orderBook[stockSymbol][reverseStockType][10 - price];
    }
  }

  if (tempQuantity > 0) {
    mintOppositeStock(stockSymbol, price, tempQuantity, userId, stockType);
  }

  initializeStockBalance(userId, stockSymbol);

  if (GlobalData.stockBalances[userId][stockSymbol][stockType]) {
    GlobalData.stockBalances[userId][stockSymbol][stockType].quantity +=
      quantity - tempQuantity;
  }

  GlobalData.inrBalances[userId].locked -=
    (quantity - tempQuantity) * price * 100;

  return {
    message: `Buy order for 'yes' added for ${stockSymbol}`,
    orderbook: GlobalData.orderBook[stockSymbol],
    order: orderItem
  };
};

export const sell = (
  userId: string,
  stockSymbol: string,
  quantity: number,
  price: number,
  stockType:"yes"|"no"
) => {
  if (!GlobalData.orderBook[stockSymbol]) {
    return { msg: "Invalid stock symbol" };
  }

  if (
    !GlobalData.stockBalances[userId]?.[stockSymbol]?.yes ||
    GlobalData.stockBalances[userId][stockSymbol].yes.quantity < quantity
  ) {
    return { error: 'Insufficient "yes" stocks to sell' };
  }
  const reverseStockType = stockType === "yes" ? "no" :"yes"
  GlobalData.stockBalances[userId][stockSymbol][stockType].quantity -= quantity;
  GlobalData.stockBalances[userId][stockSymbol][stockType].locked += quantity;

  const orderItem = createOrderItem(
    stockSymbol,
    stockType,
    userId,
    quantity,
    price,
    "sell"
  );
  let remainingQuantity = quantity;
  let opposingPrice = 10 - price;
  let tradedQuantity = 0
  for (let p in GlobalData.orderBook[stockSymbol][reverseStockType]) {
    if (remainingQuantity <= 0) break;
    if (parseFloat(p) > opposingPrice) continue;

    for (let user in GlobalData.orderBook[stockSymbol][reverseStockType][p].orders) {
      if (remainingQuantity <= 0) break;

      const availableQuantity =
        GlobalData.orderBook[stockSymbol][reverseStockType][p].orders[user].quantity;
      const matchedQuantity = Math.min(availableQuantity, remainingQuantity);
      tradedQuantity += matchedQuantity;
      updateOrderStatus(orderItem.id, tradedQuantity);
      const matchingBuyOrder = GlobalData.ordersList.find(
        order => order.userId === user &&
                order.stockType === reverseStockType &&
                order.price === parseFloat(p) &&
                order.orderType === "buy" &&
                order.status !== "completed"
      );
      if (matchingBuyOrder) {
        trackTrade(matchingBuyOrder.id, orderItem.id, matchedQuantity);
      }
      GlobalData.orderBook[stockSymbol][reverseStockType][p].orders[user].quantity -=
        matchedQuantity;
      GlobalData.orderBook[stockSymbol][reverseStockType][p].total -= matchedQuantity;
      remainingQuantity -= matchedQuantity;

      if (GlobalData.stockBalances[user][stockSymbol][reverseStockType]) {
        GlobalData.stockBalances[user][stockSymbol][reverseStockType].locked -=
          matchedQuantity;
      }

      GlobalData.inrBalances[user].balance +=
        matchedQuantity * parseFloat(p) * 100;
    }

    if (GlobalData.orderBook[stockSymbol][reverseStockType][p].total === 0) {
      delete GlobalData.orderBook[stockSymbol][reverseStockType][p];
    }
  }

  GlobalData.inrBalances[userId].balance +=
    (quantity - remainingQuantity) * price * 100;
  GlobalData.stockBalances[userId][stockSymbol][stockType].locked -=
    quantity - remainingQuantity;

  if (remainingQuantity > 0) {
    if (!GlobalData.orderBook[stockSymbol][stockType][price]) {
      GlobalData.orderBook[stockSymbol][stockType][price] = { total: 0, orders: {} };
    }

    if (!GlobalData.orderBook[stockSymbol][stockType][price].orders[userId]) {
      GlobalData.orderBook[stockSymbol][stockType][price].orders[userId] = {
        quantity: 0,
        type: "sell",
      };
    }

    GlobalData.orderBook[stockSymbol][stockType][price].total += remainingQuantity;
    GlobalData.orderBook[stockSymbol][stockType][price].orders[userId].quantity +=
      remainingQuantity;
  }

  return {
    message: `Sell order for 'yes' stock placed for ${stockSymbol}`,
    orderbook: GlobalData.orderBook[stockSymbol],
  };
};


export const  getProbabilityOfYes = (stockSymbol: string):number => {
  const recentTrades = GlobalData.ordersList
    .filter(order => order.stockSymbol === stockSymbol)
    .slice(-10);  
    
  if (recentTrades.length === 0) return 0.5; 
    
  const weightedSum = recentTrades.reduce((sum, trade) => {
    const price = trade.stockType === 'yes' ? trade.price : (10 - trade.price);
    return sum + (price * trade.quantity);
  }, 0);
    
  const totalQuantity = recentTrades.reduce((sum, trade) => sum + trade.quantity, 0);
  return weightedSum / totalQuantity / 10; 
}