
export interface Market {
    stockSymbol: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    result: "yes" | "no" | null;
  }