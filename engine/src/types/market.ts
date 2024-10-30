
export interface Market {
    stockSymbol: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    result: "yes" | "no" | null;
    isOpen:boolean;
    tradersCnt:number;
    sourceOfTruth?:string;
  }

  export interface Traders{
    [stockSymbol:string]:Set<string>
  }