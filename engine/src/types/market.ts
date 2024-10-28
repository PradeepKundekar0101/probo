
export interface Market {
    stockSymbol: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    result: "yes" | "no" | null;
    categoryType:"YT_VIEWS" | "YT_SUB" | "BTC_PRICE",
    isOpen:boolean,
    sourceId?:string 
    expectedValue?:number
    settledValue?:number

  }