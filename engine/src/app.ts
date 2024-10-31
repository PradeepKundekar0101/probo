import {
  handleBuy,
  handleSell,
  cancelOrder,
  getOrders,
  exit,
  getPrice,
} from "./controller/order";
import { createMarket, settleMarket } from "./controller/market";
import { redis } from "./index";
import { createUser } from "./controller/user";
import { onRamp } from "./controller/onramp";
import {
  getInrBalanceByUserId,
  getStockBalanceByUserId,
} from "./controller/balance";
import { getOrderBook } from "./controller/orderBook";
export const processMessages = async () => {
  try {
    const message = await redis.rpop("messageQueue");
    if (message) {
      const parsedData = JSON.parse(message);
      const { data, endPoint, eventId } = parsedData;
      switch (endPoint) {
        case "CREATE_USER":
          await createUser(data, eventId);
          break;

        case "GET_ORDER_BOOK":
          await getOrderBook(eventId);
          break;

        case "ONRAMP":
          await onRamp(data, eventId);
          break;

        case "GET_INR_BALANCE":
          await getInrBalanceByUserId(data, eventId);
          break;

        case "GET_STOCK_BALANCE":
          await getStockBalanceByUserId(data, eventId);
          break;

        case "CREATE_MARKET":
          await createMarket(data, eventId);
          break;

        case "BUY_STOCK":
          await handleBuy(data, eventId);
          break;

        case "SELL_STOCK":
          await handleSell(data, eventId);
          break;

        case "EXIT":
          await exit(data, eventId);
          break;

        case "SETTLE_MARKET":
          await settleMarket(data, eventId);
          break;
        case "GET_PRICE":
          await getPrice(data, eventId);
          break;
        case "GET_ORDERS":
          await getOrders(data, eventId);
          break;

        // case "CANCEL":
        //   await cancelOrder(data,eventId);
        //   break;
      }
    }
  } catch (error) {
    console.log(error);
  }
};
