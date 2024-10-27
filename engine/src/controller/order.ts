

import { GlobalData, orderBook } from "../db";
import { buy,sell } from "../utils/orderHelper";
import { message, publishMessage } from "../services/redis";
interface OrderData {
  price: number;
  userId: string;
  quantity: number;
  stockSymbol: string;
  stockType: "yes" | "no";
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
