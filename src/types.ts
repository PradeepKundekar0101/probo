
import { v4 as uuidv4 } from 'uuid';

export function generateOrderId(): string {
  return uuidv4();
}

// src/types/index.ts
export interface UserBalance {
  balance: number;
  locked: number;
}

export interface InrBalances {
  [userId: string]: UserBalance;
}

export interface OrderEntry {
  orderId: string;
  userId: string;
  quantity: number;
  price: number;
  timestamp: string;
}

export interface PriceLevel {
  total: number;
  orders: OrderEntry[];
}

export interface OrderBook {
  [symbol: string]: {
    sell:{
      yes: { [price: string]: OrderEntry[] };
      no: { [price: string]: OrderEntry[] };
    },
    buy:{
      yes: { [price: string]: OrderEntry[] };
      no: { [price: string]: OrderEntry[] };
    }
  };
}

export interface StockBalance {
  yes: { quantity: number; locked: number };
  no: { quantity: number; locked: number };
}

export interface StockBalances {
  [userId: string]: {
    [stockSymbol: string]: StockBalance;
  };
}

export interface Market {
  stockSymbol: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  yes: number;
  no: number;
  result: StockType | null;
}
export interface Markets {
  [stockSymbol:string]:Market 
}

export type StockType = 'yes' | 'no';

