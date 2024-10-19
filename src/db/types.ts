
export interface UserBalance {
  balance: number;
  locked: number;
}

export interface InrBalances {
  [userId: string]: UserBalance;
}

export interface OrderEntry {
  total: number;
  orders: {
    [userId: string]: number;
  };
}

export interface OrderBook {
  [symbol: string]: {
    buy:{
      yes: {
        [price: number]: OrderEntry;
      };
      no: {
        [price: number]: OrderEntry;
      };
    },
    sell:{
      yes: {
        [price: number]: OrderEntry;
      };
      no: {
        [price: number]: OrderEntry;
      };
    }
  };
}

export interface StockSymbol {
  stockSymbol: string;
}

export interface StockSymbols {
  [stockSymbol: string]: StockSymbol;
}

export interface StockBalance {
  yes: {
    quantity: number;
    locked: number;
  };
  no: {
    quantity: number;
    locked: number;
  };
}

export interface StockBalances {
  [userId: string]: {
    [stockSymbol: string]: StockBalance;
  };
}
export interface StockPool{
  [stockSymbol:string]:{
    no:number
    yes:number,
  } 
}
export interface OrderListItem{
  stockSymbol:string,
  stockType:string
  createdAt:Date,
  userId:string,
  quantity:number,
  price:number,
  id:string,
  orderType:string,
  totalPrice:number;
  status:"executed"|"pending"
}
