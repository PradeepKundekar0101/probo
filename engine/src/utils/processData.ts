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
 
};
