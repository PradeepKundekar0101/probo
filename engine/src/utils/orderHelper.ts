import { inrBalances, stockBalances, orderBook } from "../db";
import { produceMessage } from "../services/kafka";

export const isOrderValid = (
  userId: string,
  quantity: number,
  price: number
): boolean => {
  if (!inrBalances[userId] || quantity <= 0 || price <= 0) return false;
  const totalCost = quantity * price;
  return inrBalances[userId].balance >= totalCost;
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

export const mintOrder = (
  stockSymbol: string,
  price: number,
  quantity: number,
  userId: number | string,
  orderType: "yes" | "no"
) => {
  const oppositePrice = 10 - price;
  if (!orderBook[stockSymbol][orderType][oppositePrice]) {
    orderBook[stockSymbol][orderType][oppositePrice] = {
      total: 0,
      orders: {},
    };
  }
  orderBook[stockSymbol][orderType][oppositePrice].total += quantity;
  orderBook[stockSymbol][orderType][oppositePrice].orders[userId] = {
    type: "reversed",
    quantity:
      (orderBook[stockSymbol][orderType][oppositePrice].orders[userId]
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
    console.log(inrBalances)
  if (!isOrderValid(userId, quantity, price))
    return {error: "Invalid order" };
  if (!orderBook[stockSymbol]) return { error:"Invalid stock symbol" };

  initializeStockBalance(userId, stockSymbol);

  const reverseStockType = stockType === "no" ? "yes" : "no";

  inrBalances[userId].balance -= quantity * price * 100;
  inrBalances[userId].locked += quantity * price * 100;

  let availableQuantity = orderBook[stockSymbol][stockType][price]?.total || 0;
  let availableReverseQuantity =
    orderBook[stockSymbol][reverseStockType][10 - price]?.total || 0;

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

  if (stockBalances[userId][stockSymbol]?.[stockType]) {
    stockBalances[userId][stockSymbol][stockType].quantity +=
      quantity - remainingQty;
  }

  inrBalances[userId].locked -= (quantity - remainingQty) * price * 100;
  const stockBalance = stockBalances[userId][stockSymbol]
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
    data:{userId,locked:inrBalances[userId].locked,balance:inrBalances[userId].balance}
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
  const orders = orderBook[stockSymbol][orderType][price].orders;

  for (const sellerId in orders) {
    if (remainingQty <= 0) break;

    const available = orders[sellerId].quantity;
    const toTake = Math.min(available, remainingQty);

    orders[sellerId].quantity -= toTake;
    orderBook[stockSymbol][orderType][price].total -= toTake;
    remainingQty -= toTake;

    if (orders[sellerId].type === "sell") {
      if (stockBalances[sellerId][stockSymbol][orderType]) {
        stockBalances[sellerId][stockSymbol][orderType].locked -= toTake;
        inrBalances[sellerId].balance += toTake * tradePrice * 100;
      }
    } else {
      const reverseType = orderType === "yes" ? "no" : "yes";
      if (stockBalances[sellerId][stockSymbol][reverseType]) {
        stockBalances[sellerId][stockSymbol][reverseType].quantity += toTake;
        inrBalances[sellerId].locked -= toTake * tradePrice * 100;
      }
    }

    if (orders[sellerId].quantity === 0) delete orders[sellerId];
  }
  if (orderBook[stockSymbol][orderType][price].total === 0)
    delete orderBook[stockSymbol][orderType][price];
  return remainingQty;
};

export const sell = (
  userId: string,
  stockSymbol: string,
  quantity: number,
  price: number,
  stockType: "yes" | "no"
) => {
  if (!orderBook[stockSymbol]) {
    return { error: "Invalid stock symbol" };
  }

  if (
    !stockBalances[userId][stockSymbol] ||
    !stockBalances[userId]?.[stockSymbol][stockType] ||
    stockBalances[userId][stockSymbol][stockType].quantity < quantity
  )
    return { error: "Insufficient  stocks to sell" };

  stockBalances[userId][stockSymbol][stockType].quantity -= quantity;
  stockBalances[userId][stockSymbol][stockType].locked += quantity;

  const reverseStockType = stockType == "no" ? "yes" : "no";
  let remainingQuantity = quantity;

  for (let p in orderBook[stockSymbol][reverseStockType]) {
    if (remainingQuantity <= 0) break;
    if (parseFloat(p) > 10 - price) continue;

    for (let user in orderBook[stockSymbol][reverseStockType][p].orders) {
      if (remainingQuantity <= 0) break;

      const availableQuantity =
        orderBook[stockSymbol][reverseStockType][p].orders[user].quantity;
      const matchedQuantity = Math.min(availableQuantity, remainingQuantity);

      orderBook[stockSymbol][reverseStockType][p].orders[user].quantity -=
        matchedQuantity;
      orderBook[stockSymbol][reverseStockType][p].total -= matchedQuantity;
      remainingQuantity -= matchedQuantity;

      if (stockBalances[user][stockSymbol][reverseStockType]) {
        stockBalances[user][stockSymbol][reverseStockType].locked -=
          matchedQuantity;
      }

      inrBalances[user].balance += matchedQuantity * parseFloat(p) * 100;
    }

    if (orderBook[stockSymbol][reverseStockType][p].total === 0) {
      delete orderBook[stockSymbol][reverseStockType][p];
    }
  }

  inrBalances[userId].balance += (quantity - remainingQuantity) * price * 100;
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
  };
};
