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

export interface OrderListItem {
  stockSymbol: string;
  stockType: string;
  createdAt: Date;
  userId: string;
  quantity: number;
  price: number;
  id: string;
  orderType: string;
  totalPrice: number;
  status: "executed" | "pending";
}

export interface Market {
  stockSymbol: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;

  result: StockType | null;
}
export interface Markets {
  [stockSymbol: string]: Market;
}
export type StockType = "yes" | "no";

export interface OrderBook {
  [symbol: string]: {
    reverse: {
      yes: {
        [price: number]: {
          mint: {
            participants: {
              price:number;
              userId: string;
              quantity: number;
              type: "buy" | "sell";
            }[];
            remainingQty: number;
          };
          total: number;
        };
      };
      no: {
        [price: number]: {
          mint: {
            participants: {
              price:number;
              userId: string;
              quantity: number;

              type: "buy" | "sell";
            }[];
            remainingQty: number;
          };
          total: number;
        };
      };
    };
    direct: {
      yes: {
        [price: number]: OrderEntry;
      };
      no: {
        [price: number]: OrderEntry;
      };
    };
  };
}