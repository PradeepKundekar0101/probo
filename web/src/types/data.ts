export interface User{
    username:string,
    phonenumber:string,
    email:string,
    avatarUrl:string | null
}   
export interface Category{
    categoryName:string,
    id:string,
    icon:string,
}

export interface Market {
    id:string
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
    thumbnail?:string

  }