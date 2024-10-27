import { GlobalData } from "../db";
import { produceMessage } from "../services/kafka";

export const isOrderValid = (
  userId: string,
  quantity: number,
  price: number
): boolean => {
  if (!GlobalData.inrBalances[userId] || quantity <= 0 || price <= 0) return false;
  const totalCost = quantity * price;
  return GlobalData.inrBalances[userId].balance >= totalCost;
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

export const mintOrder = (
  stockSymbol: string,
  price: number,
  quantity: number,
  userId: number | string,
  orderType: "yes" | "no"
) => {
  const oppositePrice = 10 - price;
  if (!GlobalData.orderBook[stockSymbol][orderType][oppositePrice]) {
    GlobalData.orderBook[stockSymbol][orderType][oppositePrice] = {
      total: 0,
      orders: {},
    };
  }
  GlobalData.orderBook[stockSymbol][orderType][oppositePrice].total += quantity;
  GlobalData.orderBook[stockSymbol][orderType][oppositePrice].orders[userId] = {
    type: "reversed",
    quantity:
      (GlobalData.orderBook[stockSymbol][orderType][oppositePrice].orders[userId]
        ?.quantity || 0) + quantity,
  };
};

export const buy = (
  userId: string,
  stockSymbol: string,
  quantity: number,
  price: number,
  stockType: "yes" | "no"
) => {

  if (!isOrderValid(userId, quantity, price))
    return {error: "Invalid order" };
  if (!GlobalData.orderBook[stockSymbol]) return { error:"Invalid stock symbol" };

  initializeStockBalance(userId, stockSymbol);

  const reverseStockType = stockType === "no" ? "yes" : "no";

  GlobalData.inrBalances[userId].balance -= quantity * price * 100;
  GlobalData.inrBalances[userId].locked += quantity * price * 100;

  let availableQuantity = GlobalData.orderBook[stockSymbol][stockType][price]?.total || 0;
  let availableReverseQuantity =
    GlobalData.orderBook[stockSymbol][reverseStockType][10 - price]?.total || 0;

  let remainingQty = quantity;

  if (availableQuantity > 0) {
    remainingQty = processOrders(
      stockSymbol,
      stockType,
      price,
      remainingQty,
      price
    );
  }

  if (availableReverseQuantity > 0 && remainingQty > 0) {
    remainingQty = processOrders(
      stockSymbol,
      reverseStockType,
      10 - price,
      remainingQty,
      10 - price
    );
  }

  if (remainingQty > 0) {
    mintOrder(stockSymbol, price, remainingQty, userId, reverseStockType);
  }

  if (GlobalData.stockBalances[userId][stockSymbol]?.[stockType]) {
    GlobalData.stockBalances[userId][stockSymbol][stockType].quantity +=
      quantity - remainingQty;
  }

  GlobalData.inrBalances[userId].locked -= (quantity - remainingQty) * price * 100;
  const stockBalance = GlobalData.stockBalances[userId][stockSymbol]
  const {yes,no} =stockBalance
  const stock_message = {
    operation:"UPDATE_STOCK_BALANCE",
    data:{
      userId,
      noLocked:no.locked,
      yesLocked:yes.locked,
      stockSymbol,
      yesQuantity:yes.quantity,
      noQuantity:no.quantity
    }
  }
  // produceMessage(JSON.stringify({message:stock_message}))

  const inr_message = {
    operation:"UPDATE_INR_BALANCE",
    data:{userId,locked:GlobalData.inrBalances[userId].locked,balance:GlobalData.inrBalances[userId].balance}
  }
  // produceMessage(JSON.stringify({message:inr_message}))
  return {
    message: `Buy order for '${stockType}' added for ${stockSymbol}`,
  };
};

const processOrders = (
  stockSymbol: string,
  orderType: "yes" | "no",
  price: number,
  quantity: number,
  tradePrice: number
): number => {
  let remainingQty = quantity;
  const orders = GlobalData.orderBook[stockSymbol][orderType][price].orders;

  for (const sellerId in orders) {
    if (remainingQty <= 0) break;

    const available = orders[sellerId].quantity;
    const toTake = Math.min(available, remainingQty);

    orders[sellerId].quantity -= toTake;
    GlobalData.orderBook[stockSymbol][orderType][price].total -= toTake;
    remainingQty -= toTake;

    if (orders[sellerId].type === "sell") {
      if (GlobalData.stockBalances[sellerId][stockSymbol][orderType]) {
        GlobalData.stockBalances[sellerId][stockSymbol][orderType].locked -= toTake;
        GlobalData.inrBalances[sellerId].balance += toTake * tradePrice * 100;
      }
    } else {
      const reverseType = orderType === "yes" ? "no" : "yes";
      if (GlobalData.stockBalances[sellerId][stockSymbol][reverseType]) {
        GlobalData.stockBalances[sellerId][stockSymbol][reverseType].quantity += toTake;
        GlobalData.inrBalances[sellerId].locked -= toTake * tradePrice * 100;
      }
    }

    if (orders[sellerId].quantity === 0) delete orders[sellerId];
  }
  if (GlobalData.orderBook[stockSymbol][orderType][price].total === 0)
    delete GlobalData.orderBook[stockSymbol][orderType][price];
  return remainingQty;
};

export const sell = (
  userId: string,
  stockSymbol: string,
  quantity: number,
  price: number,
  stockType: "yes" | "no"
) => {
  if (!GlobalData.orderBook[stockSymbol]) {
    return { error: "Invalid stock symbol" };
  }

  if (
    !GlobalData.stockBalances[userId][stockSymbol] ||
    !GlobalData.stockBalances[userId]?.[stockSymbol][stockType] ||
    GlobalData.stockBalances[userId][stockSymbol][stockType].quantity < quantity
  )
    return { error: "Insufficient  stocks to sell" };

  GlobalData.stockBalances[userId][stockSymbol][stockType].quantity -= quantity;
  GlobalData.stockBalances[userId][stockSymbol][stockType].locked += quantity;

  const reverseStockType = stockType == "no" ? "yes" : "no";
  let remainingQuantity = quantity;

  for (let p in GlobalData.orderBook[stockSymbol][reverseStockType]) {
    if (remainingQuantity <= 0) break;
    if (parseFloat(p) > 10 - price) continue;

    for (let user in GlobalData.orderBook[stockSymbol][reverseStockType][p].orders) {
      if (remainingQuantity <= 0) break;

      const availableQuantity =
        GlobalData.orderBook[stockSymbol][reverseStockType][p].orders[user].quantity;
      const matchedQuantity = Math.min(availableQuantity, remainingQuantity);

      GlobalData.orderBook[stockSymbol][reverseStockType][p].orders[user].quantity -=
        matchedQuantity;
      GlobalData.orderBook[stockSymbol][reverseStockType][p].total -= matchedQuantity;
      remainingQuantity -= matchedQuantity;

      if (GlobalData.stockBalances[user][stockSymbol][reverseStockType]) {
        GlobalData.stockBalances[user][stockSymbol][reverseStockType].locked -=
          matchedQuantity;
      }

      GlobalData.inrBalances[user].balance += matchedQuantity * parseFloat(p) * 100;
    }

    if (GlobalData.orderBook[stockSymbol][reverseStockType][p].total === 0) {
      delete GlobalData.orderBook[stockSymbol][reverseStockType][p];
    }
  }

  GlobalData.inrBalances[userId].balance += (quantity - remainingQuantity) * price * 100;
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
  };
};
