import { handleBuy, handleSell } from './controller/order';
import {redis} from './index'
export const processMessages = async ()=>{
    try {
        const message = await redis.rpop("messageQueue");
        if(message){
            const parsedData = JSON.parse(message);
            const { data, endPoint, eventId } = parsedData;
            switch (endPoint) {
              case "BUY_STOCK":
                await handleBuy(data,eventId);
                break;
              case "SELL_STOCK":
                await handleSell(data,eventId);
                break;
            }
        }
    } catch (error) {
        console.log(error)
    }
}   