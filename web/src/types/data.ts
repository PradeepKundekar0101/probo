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
    isOpen:boolean,
    sourceOfTruth?:string 
    numberOfTraders:number
    thumbnail?:string
    categoryId:string
  }