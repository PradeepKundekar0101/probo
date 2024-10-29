import { GlobalData } from "../db/index";
import { InrBalance } from "../types/balances";
import { v4 as uuidv4 } from 'uuid';
import { OrderListItem } from "../types/orderList";

// Helper function to create new order entry
const createOrderListItem = (
  stockSymbol: string,
  stockType: "yes" | "no",
  userId: string,
  quantity: number,
  price: number,
  orderType: "buy" | "sell",
  tradedQuantity: number
): OrderListItem => {
  return {
    id: uuidv4(),
    stockSymbol,
    stockType,
    createdAt: new Date().toISOString(),
    userId,
    quantity,
    price,
    orderType,
    totalPrice: quantity * price,
    status: tradedQuantity === 0 ? "pending" : tradedQuantity === quantity ? "completed" : "partial",
    tradedQuantity
  };
};

// Helper function to update order status
const updateOrderStatus = (order: OrderListItem, newTradedQuantity: number) => {
  order.tradedQuantity = newTradedQuantity;
  order.status = order.tradedQuantity === 0 ? "pending" : 
                 order.tradedQuantity === order.quantity ? "completed" : 
                 "partial";
};

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

export const buyYesOption = (
  userId: string,
  stockSymbol: string,
  quantity: number,
  price: number
) => {
  if (!validateOrder(userId, quantity, price)) {
    return { error: "Invalid order" };
  }

  if (!GlobalData.orderBook[stockSymbol]) {
    return { error: "Invalid stock symbol" };
  }
  GlobalData.inrBalances[userId].balance -= quantity * price * 100;
  GlobalData.inrBalances[userId].locked += quantity * price * 100;


  let availableQuantity = 0;
  let availableNoQuantity = 0;
  if (GlobalData.orderBook[stockSymbol].yes[price]) {
    availableQuantity = GlobalData.orderBook[stockSymbol].yes[price].total;
    availableNoQuantity = GlobalData.orderBook[stockSymbol].no[10 - price]?.total || 0;
  }

  let tempQuantity = quantity;
  let tradedQuantity = 0;

  // Create order list item
  const orderItem = createOrderListItem(
    stockSymbol,
    "yes",
    userId,
    quantity,
    price,
    "buy",
    0
  );
  GlobalData.ordersList.push(orderItem);

  if (availableQuantity > 0) {
    for (let user in GlobalData.orderBook[stockSymbol].yes[price].orders) {
      if (tempQuantity <= 0) break;

      const available =
        GlobalData.orderBook[stockSymbol].yes[price].orders[user].quantity;
      const toTake = Math.min(available, tempQuantity);

      GlobalData.orderBook[stockSymbol].yes[price].orders[user].quantity -= toTake;
      GlobalData.orderBook[stockSymbol].yes[price].total -= toTake;
      tempQuantity -= toTake;
      tradedQuantity += toTake;

      // Update order status
      updateOrderStatus(orderItem, tradedQuantity);

      if (
        GlobalData.orderBook[stockSymbol].yes[price].orders[user].type == "sell"
      ) {
        if (GlobalData.stockBalances[user][stockSymbol].yes) {
          GlobalData.stockBalances[user][stockSymbol].yes.locked -= toTake;
          GlobalData.inrBalances[user].balance += toTake * price;
        }
      } else if (
        GlobalData.orderBook[stockSymbol].yes[price].orders[user].type ==
        "reversed"
      ) {
        if (GlobalData.stockBalances[user][stockSymbol].no) {
          GlobalData.stockBalances[user][stockSymbol].no.quantity += toTake;
          GlobalData.inrBalances[user].locked -= toTake * price;
        }
      }

      if (
        GlobalData.orderBook[stockSymbol].yes[price].orders[user].quantity === 0
      ) {
        delete GlobalData.orderBook[stockSymbol].yes[price].orders[user];
      }
    }

    if (GlobalData.orderBook[stockSymbol].yes[price].total === 0) {
      delete GlobalData.orderBook[stockSymbol].yes[price];
    }
  }

  if (
    availableNoQuantity > 0 &&
    GlobalData.orderBook[stockSymbol].no[10 - price]
  ) {
    for (let user in GlobalData.orderBook[stockSymbol].no[10 - price].orders) {
      if (tempQuantity <= 0) break;

      const available =
        GlobalData.orderBook[stockSymbol].no[10 - price].orders[user].quantity;
      const toTake = Math.min(available, tempQuantity);

      GlobalData.orderBook[stockSymbol].no[10 - price].orders[user].quantity -=
        toTake;
      GlobalData.orderBook[stockSymbol].no[10 - price].total -= toTake;
      tempQuantity -= toTake;
      tradedQuantity += toTake;

      // Update order status
      updateOrderStatus(orderItem, tradedQuantity);

      if (
        GlobalData.orderBook[stockSymbol].no[10 - price].orders[user].type ==
        "sell"
      ) {
        if (GlobalData.stockBalances[user][stockSymbol].no) {
          GlobalData.stockBalances[user][stockSymbol].no.locked -= toTake;
          GlobalData.inrBalances[user].balance += toTake * (10 - price);
        }
      } else if (
        GlobalData.orderBook[stockSymbol].no[10 - price].orders[user].type ==
        "reversed"
      ) {
        if (GlobalData.stockBalances[user][stockSymbol].yes) {
          GlobalData.stockBalances[user][stockSymbol].yes.quantity += toTake;
          GlobalData.inrBalances[user].locked -= toTake * (10 - price);
        }
      }

      if (
        GlobalData.orderBook[stockSymbol].no[10 - price].orders[user]
          .quantity === 0
      ) {
        delete GlobalData.orderBook[stockSymbol].no[10 - price].orders[user];
      }
    }

    if (GlobalData.orderBook[stockSymbol].no[10 - price].total === 0) {
      delete GlobalData.orderBook[stockSymbol].no[10 - price];
    }
  }

  if (tempQuantity > 0) {
    mintOppositeStock(stockSymbol, price, tempQuantity, userId, "yes");
  }

  initializeStockBalance(userId, stockSymbol);

  if (GlobalData.stockBalances[userId][stockSymbol]?.yes) {
    GlobalData.stockBalances[userId][stockSymbol].yes.quantity +=
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


export const buyNoOption = (
  userId: string,
  stockSymbol: string,
  quantity: number,
  price: number
) => {
  if (!validateOrder(userId, quantity, price)) {
    return { error: "Invalid order" };
  }

  GlobalData.inrBalances[userId].balance -= quantity * price * 100;
  GlobalData.inrBalances[userId].locked += quantity * price * 100;

  if (!GlobalData.orderBook[stockSymbol]) {
    return { msg: "Invalid stock symbol" };
  }

  let availableQuantity = 0;
  let availableYesQuantity = 0;
  if (GlobalData.orderBook[stockSymbol].no[price]) {
    availableQuantity = GlobalData.orderBook[stockSymbol].no[price].total;
    availableYesQuantity =
      GlobalData.orderBook[stockSymbol].yes[10 - price]?.total || 0;
  }

  let tempQuantity = quantity;

  if (availableQuantity > 0) {
    for (let user in GlobalData.orderBook[stockSymbol].no[price].orders) {
      if (!GlobalData.stockBalances[userId]) {
        GlobalData.stockBalances[userId] = {};
      }

      if (!GlobalData.stockBalances[user]) {
        GlobalData.stockBalances[user] = {};
      }

      if (!GlobalData.stockBalances[userId][stockSymbol]) {
        GlobalData.stockBalances[userId][stockSymbol] = {
          yes: { quantity: 0, locked: 0 },
          no: { quantity: 0, locked: 0 },
        };
      }

      if (!GlobalData.stockBalances[user][stockSymbol]) {
        GlobalData.stockBalances[user][stockSymbol] = {
          yes: { quantity: 0, locked: 0 },
          no: { quantity: 0, locked: 0 },
        };
      }

      if (tempQuantity <= 0) break;

      const available =
        GlobalData.orderBook[stockSymbol].no[price].orders[user].quantity;
      const toTake = Math.min(available, tempQuantity);

      GlobalData.orderBook[stockSymbol].no[price].orders[user].quantity -=
        toTake;
      GlobalData.orderBook[stockSymbol].no[price].total -= toTake;
      tempQuantity -= toTake;

      if (
        GlobalData.orderBook[stockSymbol].no[price].orders[user].type == "sell"
      ) {
        if (GlobalData.stockBalances[user][stockSymbol].no) {
          GlobalData.stockBalances[user][stockSymbol].no.locked -= toTake;
          GlobalData.inrBalances[user].balance += toTake * 100 * price;
        }
      } else if (
        GlobalData.orderBook[stockSymbol].no[price].orders[user].type ==
        "reversed"
      ) {
        if (GlobalData.stockBalances[userId][stockSymbol].yes) {
          console.log(
            "stock balance of yes actual before ",
            GlobalData.stockBalances[userId][stockSymbol].yes.quantity
          );
        }
        if (GlobalData.stockBalances[user][stockSymbol].yes) {
          GlobalData.stockBalances[user][stockSymbol].yes.quantity += toTake;
          GlobalData.inrBalances[user].locked -= toTake * 100 * price;
          console.log(
            "stock balance of yes ",
            GlobalData.stockBalances[user][stockSymbol].yes.quantity
          );
        }
        if (GlobalData.stockBalances[userId][stockSymbol].yes) {
          console.log(
            "stock balance of yes actual ",
            GlobalData.stockBalances[userId][stockSymbol].yes.quantity
          );
        }
      }

      if (
        GlobalData.orderBook[stockSymbol].no[price].orders[user].quantity === 0
      ) {
        delete GlobalData.orderBook[stockSymbol].no[price].orders[user];
      }
    }

    if (GlobalData.orderBook[stockSymbol].no[price].total === 0) {
      delete GlobalData.orderBook[stockSymbol].no[price];
    }
  }

  if (
    availableYesQuantity > 0 &&
    GlobalData.orderBook[stockSymbol].yes[10 - price]
  ) {
    for (let user in GlobalData.orderBook[stockSymbol].yes[10 - price].orders) {
      if (!GlobalData.stockBalances[userId]) {
        GlobalData.stockBalances[userId] = {};
      }

      if (!GlobalData.stockBalances[user]) {
        GlobalData.stockBalances[user] = {};
      }

      if (!GlobalData.stockBalances[userId][stockSymbol]) {
        GlobalData.stockBalances[userId][stockSymbol] = {
          yes: { quantity: 0, locked: 0 },
          no: { quantity: 0, locked: 0 },
        };
      }

      if (!GlobalData.stockBalances[user][stockSymbol]) {
        GlobalData.stockBalances[user][stockSymbol] = {
          yes: { quantity: 0, locked: 0 },
          no: { quantity: 0, locked: 0 },
        };
      }
      if (tempQuantity <= 0) break;

      const available =
        GlobalData.orderBook[stockSymbol].yes[10 - price].orders[user].quantity;
      const toTake = Math.min(available, tempQuantity);

      GlobalData.orderBook[stockSymbol].yes[10 - price].orders[user].quantity -=
        toTake;
      GlobalData.orderBook[stockSymbol].yes[10 - price].total -= toTake;
      tempQuantity -= toTake;

      if (
        GlobalData.orderBook[stockSymbol].yes[10 - price].orders[user].type ==
        "sell"
      ) {
        if (GlobalData.stockBalances[user][stockSymbol].yes) {
          GlobalData.stockBalances[user][stockSymbol].yes.locked -= toTake;
          GlobalData.inrBalances[user].balance += toTake * 100 * (10 - price);
        }
      } else if (
        GlobalData.orderBook[stockSymbol].yes[10 - price].orders[user].type ==
        "reversed"
      ) {
        if (GlobalData.stockBalances[user][stockSymbol].no) {
          GlobalData.stockBalances[user][stockSymbol].no.quantity += toTake;
          GlobalData.inrBalances[user].locked -= toTake * 100 * (10 - price);
        }
      }

      if (
        GlobalData.orderBook[stockSymbol].yes[10 - price].orders[user]
          .quantity === 0
      ) {
        delete GlobalData.orderBook[stockSymbol].yes[10 - price].orders[user];
      }
    }

    if (GlobalData.orderBook[stockSymbol].yes[10 - price].total === 0) {
      delete GlobalData.orderBook[stockSymbol].yes[10 - price];
    }
  }

  if (tempQuantity > 0) {
    mintOppositeStock(stockSymbol, price, tempQuantity, userId, "no");
  }

  initializeStockBalance(userId, stockSymbol);

  if (GlobalData.stockBalances[userId][stockSymbol]?.no) {
    GlobalData.stockBalances[userId][stockSymbol].no.quantity +=
      quantity - tempQuantity;
  }

  GlobalData.inrBalances[userId].locked -=
    (quantity - tempQuantity) * price * 100;

  return {
    message: `Buy order for 'no' added for ${stockSymbol}`,
    orderbook: GlobalData.orderBook[stockSymbol],
  };
};
export const sellYesOption = (
  userId: string,
  stockSymbol: string,
  quantity: number,
  price: number
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

  GlobalData.stockBalances[userId][stockSymbol].yes.quantity -= quantity;
  GlobalData.stockBalances[userId][stockSymbol].yes.locked += quantity;

  let remainingQuantity = quantity;
  let opposingPrice = 10 - price;

  for (let p in GlobalData.orderBook[stockSymbol].no) {
    if (remainingQuantity <= 0) break;
    if (parseFloat(p) > opposingPrice) continue;

    for (let user in GlobalData.orderBook[stockSymbol].no[p].orders) {
      if (remainingQuantity <= 0) break;

      const availableQuantity =
        GlobalData.orderBook[stockSymbol].no[p].orders[user].quantity;
      const matchedQuantity = Math.min(availableQuantity, remainingQuantity);

      GlobalData.orderBook[stockSymbol].no[p].orders[user].quantity -=
        matchedQuantity;
      GlobalData.orderBook[stockSymbol].no[p].total -= matchedQuantity;
      remainingQuantity -= matchedQuantity;

      if (GlobalData.stockBalances[user][stockSymbol].no) {
        GlobalData.stockBalances[user][stockSymbol].no.locked -=
          matchedQuantity;
      }

      GlobalData.inrBalances[user].balance +=
        matchedQuantity * parseFloat(p) * 100;
    }

    if (GlobalData.orderBook[stockSymbol].no[p].total === 0) {
      delete GlobalData.orderBook[stockSymbol].no[p];
    }
  }

  GlobalData.inrBalances[userId].balance +=
    (quantity - remainingQuantity) * price * 100;
  GlobalData.stockBalances[userId][stockSymbol].yes.locked -=
    quantity - remainingQuantity;

  if (remainingQuantity > 0) {
    if (!GlobalData.orderBook[stockSymbol].yes[price]) {
      GlobalData.orderBook[stockSymbol].yes[price] = { total: 0, orders: {} };
    }

    if (!GlobalData.orderBook[stockSymbol].yes[price].orders[userId]) {
      GlobalData.orderBook[stockSymbol].yes[price].orders[userId] = {
        quantity: 0,
        type: "sell",
      };
    }

    GlobalData.orderBook[stockSymbol].yes[price].total += remainingQuantity;
    GlobalData.orderBook[stockSymbol].yes[price].orders[userId].quantity +=
      remainingQuantity;
  }

  return {
    message: `Sell order for 'yes' stock placed for ${stockSymbol}`,
    orderbook: GlobalData.orderBook[stockSymbol],
  };
};

export const sellNoOption = (
  userId: string,
  stockSymbol: string,
  quantity: number,
  price: number
) => {
  if (!GlobalData.orderBook[stockSymbol]) {
    return { msg: "Invalid stock symbol" };
  }

  if (
    !GlobalData.stockBalances[userId]?.[stockSymbol]?.no ||
    GlobalData.stockBalances[userId][stockSymbol].no.quantity < quantity
  ) {
    return { error: 'Insufficient "no" stocks to sell' };
  }

  GlobalData.stockBalances[userId][stockSymbol].no.quantity -= quantity;
  GlobalData.stockBalances[userId][stockSymbol].no.locked += quantity;

  let remainingQuantity = quantity;
  let opposingPrice = 10 - price;

  for (let p in GlobalData.orderBook[stockSymbol].yes) {
    if (remainingQuantity <= 0) break;
    if (parseFloat(p) > opposingPrice) continue;

    for (let user in GlobalData.orderBook[stockSymbol].yes[p].orders) {
      if (remainingQuantity <= 0) break;

      const availableQuantity =
        GlobalData.orderBook[stockSymbol].yes[p].orders[user].quantity;
      const matchedQuantity = Math.min(availableQuantity, remainingQuantity);

      GlobalData.orderBook[stockSymbol].yes[p].orders[user].quantity -=
        matchedQuantity;
      GlobalData.orderBook[stockSymbol].yes[p].total -= matchedQuantity;
      remainingQuantity -= matchedQuantity;

      if (GlobalData.stockBalances[user][stockSymbol].yes) {
        GlobalData.stockBalances[user][stockSymbol].yes.locked -=
          matchedQuantity;
      }

      GlobalData.inrBalances[user].balance +=
        matchedQuantity * parseFloat(p) * 100;
    }

    if (GlobalData.orderBook[stockSymbol].yes[p].total === 0) {
      delete GlobalData.orderBook[stockSymbol].yes[p];
    }
  }

  GlobalData.inrBalances[userId].balance +=
    (quantity - remainingQuantity) * price * 100;
  GlobalData.stockBalances[userId][stockSymbol].no.locked -=
    quantity - remainingQuantity;

  if (remainingQuantity > 0) {
    if (!GlobalData.orderBook[stockSymbol].no[price]) {
      GlobalData.orderBook[stockSymbol].no[price] = { total: 0, orders: {} };
    }

    if (!GlobalData.orderBook[stockSymbol].no[price].orders[userId]) {
      GlobalData.orderBook[stockSymbol].no[price].orders[userId] = {
        quantity: 0,
        type: "sell",
      };
    }

    GlobalData.orderBook[stockSymbol].no[price].total += remainingQuantity;
    GlobalData.orderBook[stockSymbol].no[price].orders[userId].quantity +=
      remainingQuantity;
  }

  return {
    message: `Sell order for 'no' stock placed for ${stockSymbol}`,
    orderbook: GlobalData.orderBook[stockSymbol],
  };
};
