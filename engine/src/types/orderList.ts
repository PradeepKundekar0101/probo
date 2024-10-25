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
  