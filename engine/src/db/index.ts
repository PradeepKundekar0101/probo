
import { InrBalances, OrderBook, OrderListItem, StockBalances,Markets } from './types';

export const inrBalances: InrBalances = {
    pradeep:{
        balance:150000,
        locked:0
    },
    sahil:{
        balance:150000,
        locked:0
    }
};
export const stockBalances: StockBalances = {
    pradeep:{},
    sahil:{}
};
export const currentMarketPrice: { [stockSymbol: string]: { yes: number, no: number } } = {};
export const orderBook: OrderBook = {
    AAPL:{
        reverse:{no:{},yes:{}},
        direct:{no:{},yes:{}}
    }
};

export const marketMakerId = 'marketMaker';
export const markets:Markets={
    APPL:{
        stockSymbol: "AAPL",
        title: "Apple Stock Prediction Market",
        description: "Will Apple stock close above $180 on 2024-12-31?",
        startTime: new Date("2024-10-18T09:00:00Z"),
        endTime: new Date("2024-10-18T23:00:00Z"),
        result:null
    }
}
export const ordersList:OrderListItem[] = []
