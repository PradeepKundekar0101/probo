import { prismaClient } from "../services/prisma";

enum StockType {
  yes = "yes",
  no = "no"
}
enum OrderStatus {
  pending = "pending",
  partial = "partial",
  completed = "completed"
}

interface OrderCreateInput {
  id: string;
  stockSymbol: string;
  stockType: StockType;
  createdAt: string;
  userId: string;
  quantity: number;
  price: number;
  orderType: string;
  totalPrice: number;
  status: OrderStatus;
  tradedQuantity: number;
  marketId: string; 
}

export const insertOrderItem = async (data: OrderCreateInput) => {
  const {
    stockSymbol,
    stockType,
    createdAt,
    userId,
    quantity,
    tradedQuantity,
    price,
    totalPrice,
    status,
    marketId, 
  } = data;
  console.log("Creating order item")
  try {
    const newOrderItem = await prismaClient.order.create({
      data: {
        stockSymbol,
        stockType: stockType.toString(), 
        createdAt: new Date(createdAt),
        userId,
        quantity,
        tradedQuantity,
        price,
        totalPrice,
        status: status.toString(), 
        marketId, 
        orderType: data.orderType, 
      },
    });
  
    return newOrderItem;
    
  } catch (error) {
    console.log(error)
  }
};