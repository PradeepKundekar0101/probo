import {
  getInrBalanceAll,
  getInrBalanceByUserId,
  getStockBalanceAll,
  getStockBalanceByUserId,
} from "../controller/balance";
import { createMarket } from "../controller/market";
import { onRamp } from "../controller/onramp";
import { handleBuy, handleSell } from "../controller/order";
import { getOrderBook } from "../controller/orderBook";
import { createUser } from "../controller/user";

export const processData = async (rawData: string) => {
  const parsedData = JSON.parse(rawData);

  const { data, endPoint, eventId } = parsedData;
  switch (endPoint) {
    case "CREATE_USER":
      await createUser(data, eventId);
      break;

    case "ONRAMP":
      await onRamp(data, eventId);
      break;

    case "GET_INR_BALANCE_ALL":
      await getInrBalanceAll(eventId);
      break;
    case "GET_INR_BALANCE_USERID":
      await getInrBalanceByUserId(data, eventId);
      break;
    case "GET_STOCK_BALANCE_ALL":
      await getStockBalanceAll(eventId);
      break;
    case "GET_STOCK_BALANCE_USERID":
      await getStockBalanceByUserId(data, eventId);
      break;

    case "GET_ORDER_BOOK":
      await getOrderBook(eventId);
      break;

    case "CREATE_MARKET":
      await createMarket(data, eventId);
      break;

    case "BUY_STOCK":
      await handleBuy(data,eventId);
      break;
    case "SELL_STOCK":
      await handleSell(data,eventId);
      break;
  }
};
