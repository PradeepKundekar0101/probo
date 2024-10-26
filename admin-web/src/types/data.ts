export interface User{
    username:string,
    email:string,
    phonenumber:string,
    avatarUrl?:string,
    id:string
}

export interface Market {

    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    result: "yes" | "no" | null;
    categoryId:string,
    id:string,
    thumbnail:string
  }
  export interface Category{
    categoryName:string,
    icon:string,
    id:string
  }