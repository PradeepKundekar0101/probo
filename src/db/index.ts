// src/db/index.ts
import { InrBalances, OrderBook, StockBalances, Market } from './types';

export const inrBalances: InrBalances = {};
export const orderBook: OrderBook = {};
export const stockBalances: StockBalances = {};
export const markets: { [stockSymbol: string]: Market } = {};
export const lastTradedPrices: { [stockSymbol: string]: { yes: number, no: number } } = {};
export const marketMakerId = 'marketMaker';