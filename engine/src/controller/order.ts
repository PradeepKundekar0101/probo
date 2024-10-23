import { currentMarketPrice, inrBalances, orderBook, ordersList, stockBalances } from "../db";
import { generateId } from "../utils/generateOrderId";
import { parsedOrderBook } from "../utils/parseOrderBook";
import { message, publishMessage } from "../utils/publishResponse";
import { broadCastMessage } from "../utils/ws";



interface OrderData {
  price: number;
  userId: string;
  quantity: number;
  stockSymbol: string;
  stockType: "yes" | "no";
}
type StockType = "yes" | "no";



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


export const handleBuy = async (data: OrderData, eventId: string) => {
  try {
    const { userId: buyerId, stockSymbol, quantity, price, stockType } = data;
    if(!buyerId || !stockSymbol || !quantity || price === undefined || !stockType)
      return publishMessage( message(400, "Required all parameters", null), eventId);
    if (!orderBook[stockSymbol])
      return publishMessage(message(400, "Stock symbol not found", null),eventId);
    const totalCost = quantity * price;
    if (!inrBalances[buyerId] || inrBalances[buyerId].balance < totalCost) 
        return publishMessage(message(400, "Insuffient balance", null), eventId);

    if (!stockBalances[buyerId])  stockBalances[buyerId] = {};
    
    if (!stockBalances[buyerId][stockSymbol]) {
      stockBalances[buyerId][stockSymbol] = {
        yes: { quantity: 0, locked: 0 },
        no: { quantity: 0, locked: 0 },
      };
    }
    let availableStocks: number = quantity;
    let totalTradeQty = 0;
    //direct order matching
    if (
      orderBook[stockSymbol]["direct"][stockType][price] &&
      orderBook[stockSymbol]["direct"][stockType][price].total > 0
    ) {
      const orders = orderBook[stockSymbol]["direct"][stockType][price].orders;

      for (const sellerId in orders) {
        if (availableStocks === 0) break;
        const sellerQuantity = orders[sellerId];
        const tradeQuantity = Number(Math.min(availableStocks, sellerQuantity));
        // Execute the trade
        totalTradeQty += tradeQuantity;
        availableStocks -= tradeQuantity;
        // update seller's balances
        inrBalances[sellerId].balance += tradeQuantity * price;
        stockBalances[sellerId][stockSymbol][stockType as StockType].locked -=
          tradeQuantity;
        // update buyer's stock balance
        stockBalances[buyerId][stockSymbol][stockType as StockType].quantity +=
          tradeQuantity;
        // Uupdate orderbook
        orderBook[stockSymbol]["direct"][stockType][price].total -=
          tradeQuantity;
        orderBook[stockSymbol]["direct"][stockType][price].orders[sellerId] -=
          tradeQuantity;
        if (orderBook[stockSymbol]["direct"][stockType][price].orders[sellerId] === 0) 
          delete orderBook[stockSymbol]["direct"][stockType as StockType][price].orders[sellerId];
      }
      if (orderBook[stockSymbol]["direct"][stockType][price].total === 0) 
        delete orderBook[stockSymbol]["direct"][stockType][price];
      
    }
    //settle the buyer
    if (availableStocks === 0) {
      inrBalances[buyerId].balance -= totalTradeQty * price;
        updateCurrentMarketPrice(stockSymbol,stockType,price)
        broadCastMessage(stockSymbol,JSON.stringify(parsedOrderBook()))
      return publishMessage(
        message(200, `${totalTradeQty} qty traded directly`, null),
        eventId
      );
    }
    //now let's satisfy the pending reverse orders
    let leftOverStockAfterReverseMatching = availableStocks;
    const reverseStockType = stockType == "no" ? "yes" : "no";
    const reversePrice = 1000 - price;
    if (
      orderBook[stockSymbol].reverse[stockType] &&
      orderBook[stockSymbol].reverse[stockType][price] &&
      orderBook[stockSymbol]["reverse"][stockType][price].mint.remainingQty > 0
    ) {
      const remainingQty =
        orderBook[stockSymbol].reverse[stockType][price].mint.remainingQty;
      const participants =
        orderBook[stockSymbol].reverse[stockType][price].mint.participants;
      if (leftOverStockAfterReverseMatching >= remainingQty) {
        participants.forEach((p) => {
          const stockTypeToAdd =
            p.type == "buy" ? (stockType === "no" ? "yes" : "no") : stockType;
          if (p.type == "buy") {
            inrBalances[p.userId].locked -= p.price * p.quantity;
            stockBalances[p.userId][stockSymbol][stockTypeToAdd].quantity +=
              p.quantity;
          } else {
            inrBalances[p.userId].balance += price * p.quantity;
            stockBalances[p.userId][stockSymbol][stockTypeToAdd].quantity +=
              p.quantity;
          }
        });
        inrBalances[buyerId].balance -= remainingQty * price;
        stockBalances[buyerId][stockSymbol][stockType].quantity += remainingQty;
        delete orderBook[stockSymbol].reverse[stockType][price];
        const stillLeft = leftOverStockAfterReverseMatching - remainingQty;
        if (stillLeft > 0) {
          if (!orderBook[stockSymbol].reverse[reverseStockType])
            orderBook[stockSymbol].reverse[reverseStockType] = {};
          if (!orderBook[stockSymbol].reverse[reverseStockType][reversePrice]) {
            orderBook[stockSymbol].reverse[reverseStockType][reversePrice] = {
              total: 0,
              mint: {
                participants: [],
                remainingQty: 0,
              },
            };
          }
          orderBook[stockSymbol].reverse[reverseStockType][
            reversePrice
          ].total += stillLeft;
          inrBalances[buyerId].locked += stillLeft * price;
          inrBalances[buyerId].balance -= stillLeft * price;
          orderBook[stockSymbol].reverse[reverseStockType][
            reversePrice
          ].mint.participants.push({
            userId: buyerId,
            quantity: stillLeft,
            price: price,
            type: "buy",
          });
          orderBook[stockSymbol].reverse[reverseStockType][
            reversePrice
          ].mint.remainingQty += stillLeft;
        }
      } else {
        orderBook[stockSymbol].reverse[stockType][price].mint.participants.push(
          {
            userId: buyerId,
            quantity: leftOverStockAfterReverseMatching,
            price: price,
            type: "sell",
          }
        );

        inrBalances[buyerId].locked +=
          leftOverStockAfterReverseMatching * price;
        inrBalances[buyerId].balance -=leftOverStockAfterReverseMatching * price
        orderBook[stockSymbol].reverse[stockType][price].mint.remainingQty -=
          leftOverStockAfterReverseMatching;
      }
      broadCastMessage(stockSymbol,JSON.stringify(parsedOrderBook()))
      updateCurrentMarketPrice(stockSymbol,stockType,price)

      return publishMessage(message(200, `Buy completed`, null), eventId);
    }

    if (!orderBook[stockSymbol].reverse[reverseStockType])
      orderBook[stockSymbol].reverse[reverseStockType] = {};

    if (!orderBook[stockSymbol].reverse[reverseStockType][reversePrice]) {
      orderBook[stockSymbol].reverse[reverseStockType][reversePrice] = {
        total: 0,
        mint: {
          participants: [],
          remainingQty: 0,
        },
      };
    }
    orderBook[stockSymbol].reverse[reverseStockType][reversePrice].total +=
      leftOverStockAfterReverseMatching;
    inrBalances[buyerId].locked += leftOverStockAfterReverseMatching * price;
    inrBalances[buyerId].balance -= leftOverStockAfterReverseMatching * price;
    orderBook[stockSymbol].reverse[reverseStockType][
      reversePrice
    ].mint.participants.push({
      userId: buyerId,
      quantity: leftOverStockAfterReverseMatching,
      price: price,
      type: "buy",
    });
    orderBook[stockSymbol].reverse[reverseStockType][
      reversePrice
    ].mint.remainingQty += leftOverStockAfterReverseMatching;
      updateCurrentMarketPrice(stockSymbol,stockType,price)
      broadCastMessage(stockSymbol,JSON.stringify(parsedOrderBook()))
    return publishMessage(message(200,`Complete `,null),
      eventId
    );
  } catch (error:any) {
    return publishMessage(message(500, error.message, null),eventId);
  }
};
export const handleSell = async (data: OrderData,eventId:string) => {
  try {
    const { userId: sellerId, stockSymbol, quantity, price, stockType } = data;

    if ( !sellerId || !stockSymbol || !quantity || price === undefined || !stockType)
        return publishMessage( message(400, "Required all parameters", null), eventId);
    
    if (!orderBook[stockSymbol]) 
        return publishMessage( message(404, "Market not found", null), eventId);
    
    if (
        !stockBalances[sellerId] ||
        !stockBalances[sellerId][stockSymbol] ||
        stockBalances[sellerId][stockSymbol][stockType as StockType].quantity <
        quantity
    ) {
        return publishMessage( message(400, "Insufficient stock balance", null), eventId);
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
          broadCastMessage(stockSymbol,JSON.stringify(parsedOrderBook()))
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
    return publishMessage( message(201, "Sell order placed successfully", null), eventId);

  } catch (error) {
    console.log(error)
  }
};
