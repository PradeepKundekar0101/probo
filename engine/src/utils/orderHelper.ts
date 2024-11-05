import { GlobalData } from "../db/index";
import { createOrderItem, trackTrade, updateOrderStatus } from "./orderTrackingHelper";
const {orderBook,ordersList,inrBalances,stockBalances} = GlobalData

export const validateOrder = (
  userId: string,
  quantity: number,
  price: number
): boolean => {
  if (!inrBalances[userId]) return false;
  if (inrBalances[userId].balance < quantity * price || price <= 0)
    return false;
  return true;
};

export const initializeStockBalance = (userId: string, stockSymbol: string) => {
  if (!stockBalances[userId]) {
    stockBalances[userId] = {};
  }
  if (!stockBalances[userId][stockSymbol]) {
    stockBalances[userId][stockSymbol] = {
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
    if (!orderBook[stockSymbol].no[oppositePrice]) {
      orderBook[stockSymbol].no[oppositePrice] = {
        total: 0,
        orders: {},
      };
    }
    orderBook[stockSymbol].no[oppositePrice].total += quantity;
    orderBook[stockSymbol].no[oppositePrice].orders[userId] = {
      type: "reversed",
      quantity:
        (orderBook[stockSymbol].no[oppositePrice].orders[userId]
          ?.quantity || 0) + quantity,
    };
  } else {
    if (!orderBook[stockSymbol].yes[oppositePrice]) {
      orderBook[stockSymbol].yes[oppositePrice] = {
        total: 0,
        orders: {},
      };
    }
    orderBook[stockSymbol].yes[oppositePrice].total += quantity;
    orderBook[stockSymbol].yes[oppositePrice].orders[userId] = {
      type: "reversed",
      quantity:
        (orderBook[stockSymbol].yes[oppositePrice].orders[userId]
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

  if (!orderBook[stockSymbol]) {
    return { error: "Invalid stock symbol" };
  }
  inrBalances[userId].balance -= quantity * price * 100;
  inrBalances[userId].locked += quantity * price * 100;

  const reverseStockType = stockType =="yes"?"no":"yes"
  let availableQuantity = 0;
  let availableReverseQuantity = 0;
  if (orderBook[stockSymbol][stockType][price]) {
    availableQuantity = orderBook[stockSymbol][stockType][price].total;
    availableReverseQuantity = orderBook[stockSymbol][reverseStockType][10 - price]?.total || 0;
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
  
  ordersList.push(orderItem);

  if (availableQuantity > 0) {
    for (let user in orderBook[stockSymbol][stockType][price].orders) {
      if (tempQuantity <= 0) break;

      const available = orderBook[stockSymbol][stockType][price].orders[user].quantity;
      const toTake = Math.min(available, tempQuantity);

      orderBook[stockSymbol][stockType][price].orders[user].quantity -= toTake;
      orderBook[stockSymbol][stockType][price].total -= toTake;
      tempQuantity -= toTake;
      tradedQuantity += toTake;


      updateOrderStatus(orderItem.id, tradedQuantity);

      if (orderBook[stockSymbol][stockType][price].orders[user].type == "sell" ) {
        const matchingSellOrder = ordersList.find(
          order => order.userId === user && 
                  order.stockType === stockType && 
                  order.price === price &&
                  order.orderType === "sell" &&
                  order.status !== "completed"
        );
        if (matchingSellOrder) {
          trackTrade(orderItem.id, matchingSellOrder.id, toTake);
        }
        if (stockBalances[user][stockSymbol][stockType]) {
          stockBalances[user][stockSymbol][stockType].locked -= toTake;
          inrBalances[user].balance += toTake * price;
        }
      } else if (
        orderBook[stockSymbol][stockType][price].orders[user].type == "reversed"
      ) {
        if (stockBalances[user][stockSymbol][reverseStockType]) {
          stockBalances[user][stockSymbol][reverseStockType].quantity += toTake;
          inrBalances[user].locked -= toTake * price;
        }
      }

      if (
        orderBook[stockSymbol][stockType][price].orders[user].quantity === 0
      ) {
        delete orderBook[stockSymbol][stockType][price].orders[user];
      }
    }

    if (orderBook[stockSymbol][stockType][price].total === 0) {
      delete orderBook[stockSymbol][stockType][price];
    }
  }

  if (
    availableReverseQuantity > 0 &&
    orderBook[stockSymbol][reverseStockType][10 - price]
  ) {
    for (let user in orderBook[stockSymbol][reverseStockType][10 - price].orders) {
      if (tempQuantity <= 0) break;

      const available =
        orderBook[stockSymbol][reverseStockType][10 - price].orders[user].quantity;
      const toTake = Math.min(available, tempQuantity);

      orderBook[stockSymbol][reverseStockType][10 - price].orders[user].quantity -=
        toTake;
      orderBook[stockSymbol][reverseStockType][10 - price].total -= toTake;
      tempQuantity -= toTake;
      tradedQuantity += toTake;

      // Update order status
      updateOrderStatus(orderItem.id, tradedQuantity);

      if (
        orderBook[stockSymbol][reverseStockType][10 - price].orders[user].type ==
        "sell"
      ) {

        const matchingSellOrder = ordersList.find(
          order => order.userId === user && 
                  order.stockType === stockType && 
                  order.price === 10 - price &&
                  order.orderType === "sell" &&
                  order.status !== "completed"
        );
        if (matchingSellOrder) {
          trackTrade(orderItem.id, matchingSellOrder.id, toTake);
        }
        if (stockBalances[user][stockSymbol][reverseStockType]) {
          stockBalances[user][stockSymbol][reverseStockType].locked -= toTake;
          inrBalances[user].balance += toTake * (10 - price);
        }
      } else if (
        orderBook[stockSymbol][reverseStockType][10 - price].orders[user].type ==
        "reversed"
      ) {
        if (stockBalances[user][stockSymbol][stockType]) {
          stockBalances[user][stockSymbol][stockType].quantity += toTake;
          inrBalances[user].locked -= toTake * (10 - price);
        }
      }

      if (
        orderBook[stockSymbol][reverseStockType][10 - price].orders[user]
          .quantity === 0
      ) {
        delete orderBook[stockSymbol][reverseStockType][10 - price].orders[user];
      }
    }

    if (orderBook[stockSymbol][reverseStockType][10 - price].total === 0) {
      delete orderBook[stockSymbol][reverseStockType][10 - price];
    }
  }

  if (tempQuantity > 0) {
    mintOppositeStock(stockSymbol, price, tempQuantity, userId, stockType);
  }

  initializeStockBalance(userId, stockSymbol);

  if (stockBalances[userId][stockSymbol][stockType]) {
    stockBalances[userId][stockSymbol][stockType].quantity +=
      quantity - tempQuantity;
  }

  inrBalances[userId].locked -=
    (quantity - tempQuantity) * price * 100;

  return {
    message: `Buy order for 'yes' added for ${stockSymbol}`,
    orderbook: orderBook[stockSymbol],
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
  if (!orderBook[stockSymbol]) {
    return { msg: "Invalid stock symbol" };
  }

  if (
    !stockBalances[userId]?.[stockSymbol]?.yes ||
    stockBalances[userId][stockSymbol].yes.quantity < quantity
  ) {
    return { error: `Insufficient ${stockType} stocks to sell` };
  }
  const reverseStockType = stockType === "yes" ? "no" :"yes"
  stockBalances[userId][stockSymbol][stockType].quantity -= quantity;
  stockBalances[userId][stockSymbol][stockType].locked += quantity;

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
  for (let p in orderBook[stockSymbol][reverseStockType]) {
    if (remainingQuantity <= 0) break;
    if (parseFloat(p) > opposingPrice) continue;

    for (let user in orderBook[stockSymbol][reverseStockType][p].orders) {
      if (remainingQuantity <= 0) break;

      const availableQuantity =
        orderBook[stockSymbol][reverseStockType][p].orders[user].quantity;
      const matchedQuantity = Math.min(availableQuantity, remainingQuantity);
      tradedQuantity += matchedQuantity;
      updateOrderStatus(orderItem.id, tradedQuantity);
      const matchingBuyOrder = ordersList.find(
        order => order.userId === user &&
                order.stockType === reverseStockType &&
                order.price === parseFloat(p) &&
                order.orderType === "buy" &&
                order.status !== "completed"
      );
      if (matchingBuyOrder) {
        trackTrade(matchingBuyOrder.id, orderItem.id, matchedQuantity);
      }
      orderBook[stockSymbol][reverseStockType][p].orders[user].quantity -=
        matchedQuantity;
      orderBook[stockSymbol][reverseStockType][p].total -= matchedQuantity;
      remainingQuantity -= matchedQuantity;

      if (stockBalances[user][stockSymbol][reverseStockType]) {
        stockBalances[user][stockSymbol][reverseStockType].locked -=
          matchedQuantity;
      }

      inrBalances[user].balance +=
        matchedQuantity * parseFloat(p) * 100;
    }

    if (orderBook[stockSymbol][reverseStockType][p].total === 0) {
      delete orderBook[stockSymbol][reverseStockType][p];
    }
  }

  inrBalances[userId].balance +=
    (quantity - remainingQuantity) * price * 100;
  stockBalances[userId][stockSymbol][stockType].locked -=
    quantity - remainingQuantity;

  if (remainingQuantity > 0) {
    if (!orderBook[stockSymbol][stockType][price]) {
      orderBook[stockSymbol][stockType][price] = { total: 0, orders: {} };
    }

    if (!orderBook[stockSymbol][stockType][price].orders[userId]) {
      orderBook[stockSymbol][stockType][price].orders[userId] = {
        quantity: 0,
        type: "sell",
      };
    }

    orderBook[stockSymbol][stockType][price].total += remainingQuantity;
    orderBook[stockSymbol][stockType][price].orders[userId].quantity +=
      remainingQuantity;
  }

  return {
    message: `Sell order for 'yes' stock placed for ${stockSymbol}`,
    orderbook: orderBook[stockSymbol],
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