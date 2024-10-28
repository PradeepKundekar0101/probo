

import { GlobalData, orderBook, stockBalances } from "../db";
import { buy,sell } from "../utils/orderHelper";
import { message, publishMessage } from "../services/redis";
interface OrderData {
  price: number;
  userId: string;
  quantity: number;
  stockSymbol: string;
  stockType: "yes" | "no";
}
interface OrderCancelData { 
  orderId:string
}

export const handleBuy = async (data:OrderData,eventId:string)=>{
    const { userId, stockSymbol, quantity, price:buyerPrice, stockType } = data;
    const price = buyerPrice/100;
    const response = buy(userId, stockSymbol, quantity, price,stockType)
    if(response.error){
      console.log("error")
      console.log(response.error)
      return publishMessage(message(400, response.error, null), eventId);
    }
    const parsedOrderBook = JSON.stringify( GlobalData.orderBook[stockSymbol])
    publishMessage(message(200,"",{stockSymbol,orderBook:parsedOrderBook}),"MESSAGE")    
    publishMessage(message(200, `Buy successful`, null),eventId);
}

export const handleSell = async (data:OrderData,eventId:string)=>{
  const { userId, stockSymbol, quantity, price:sellerPrice, stockType } = data;
  const price = sellerPrice/100;
  const response = sell(userId, stockSymbol, quantity, price,stockType)
  if(response.error)
    return publishMessage(message(400, response.error, null), eventId);
  const parsedOrderBook = JSON.stringify( GlobalData.orderBook[stockSymbol])
  publishMessage(message(200,"",{stockSymbol,orderBook:parsedOrderBook}),"MESSAGE")    
  publishMessage(message(200, `Sold`, null),eventId);
}

export const cancelOrder = async (data:OrderCancelData,eventId:string)=>{
    const {orderId} = data
    console.log(orderId)
    const order = GlobalData.ordersList.filter((e)=>e.id===orderId)
    if(order.length==0){
      publishMessage(message(404,"Order not found",null),eventId)
    }
    const {quantity,stockSymbol,stockType,price,userId,totalPrice} = order[0]
    GlobalData.orderBook[stockSymbol][stockType as "yes"|"no"][price].total-=quantity
    GlobalData.orderBook[stockSymbol][stockType as "yes"|"no"][price].orders[userId].quantity-=quantity
    if(GlobalData.orderBook[stockSymbol][stockType as "yes"|"no"][price].orders[userId].type==="sell"){
      GlobalData.stockBalances[userId][stockSymbol][stockType as "yes"|"no"].locked -= quantity
      GlobalData.stockBalances[userId][stockSymbol][stockType as "yes"|"no"].quantity += quantity
    }
    else{
      GlobalData.inrBalances[userId].locked-=totalPrice
      GlobalData.inrBalances[userId].balance+=totalPrice
    }
    const parsedOrderBook = JSON.stringify( GlobalData.orderBook[stockSymbol])
    publishMessage(message(200,"",{stockSymbol,orderBook:parsedOrderBook}),"MESSAGE")    
    publishMessage(message(200, `Order cancelled`, null),eventId);
}

// controller/order.ts - Updated getOrders function
export const getOrders = async (data: string, eventId: string) => {
  try {
    const orders = GlobalData.ordersList.filter((order) => order.userId === data)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first
    
    publishMessage(
      message(200, "Orders retrieved successfully", { orders }), 
      eventId
    );
  } catch (error) {
    console.error("Error retrieving orders:", error);
    publishMessage(
      
      message(500, "Error",null), 
      eventId
    );
  }
};

export const exit = async (data:{stockSymbol:string,userId:string},eventId:string)=>{
  const { userId, stockSymbol } = data;
  // const stockBalances = GlobalData.stockBalances[userId][stockSymbol]
  // const price = sellerPrice/100;
  // const response = sell(userId, stockSymbol, quantity, price,stockType)
  // if(response.error)
  //   return publishMessage(message(400, response.error, null), eventId);
  // const parsedOrderBook = JSON.stringify( GlobalData.orderBook[stockSymbol])
  // publishMessage(message(200,"",{stockSymbol,orderBook:parsedOrderBook}),"MESSAGE")    
  // publishMessage(message(200, `Sold`, null),eventId);
}