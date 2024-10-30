import { InrBalance, StockBalance } from "../types/balances";
import { Market, Traders } from "../types/market";
import { OrderBook } from "../types/orderbook";
import { OrderListItem } from "../types/orderList";

export const inrBalances: InrBalance = {};
export const stockBalances: StockBalance = {};
export const orderBook: Record<string,OrderBook>= {};
export const markets:Record<string,Market>={}
export const ordersList:OrderListItem[] = []
export const traders:Traders = {}
export const GlobalData = {
    inrBalances,
    stockBalances,
    orderBook,
    markets,
    ordersList,
    traders
}