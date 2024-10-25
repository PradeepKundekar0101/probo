export interface InrBalance {
  [userId:string]:{
    balance: number;
    locked: number;
  }
}

export interface StockBalance {
  [userId:string]:{
    [stockSymbol:string]:{
      yes: {
        quantity: number;
        locked: number;
      };
      no: {
        quantity: number;
        locked: number;
      };

    }
  }
}


