
import { InrBalances, OrderBook, OrderListItem, StockBalances,Markets } from './types';

export const inrBalances: InrBalances = {};
export const stockBalances: StockBalances = {};
export const currentMarketPrice: { [stockSymbol: string]: { yes: number, no: number } } = {};
export const orderBook: OrderBook = {};

export const marketMakerId = 'marketMaker';
export const markets:Markets={}
export const ordersList:OrderListItem[] = []
