export interface OrderListItem {
    id: string; 
    stockSymbol: string;
    stockType: string;
    createdAt: string;
    userId: string;
    quantity: number;
    price: number;
    orderType: string;
    totalPrice: number;
    status:"pending" | "partial" | "completed",
    tradedQuantity:number
  }
 