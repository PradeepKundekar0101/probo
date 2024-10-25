import { handleBuy, handleSell } from './controller/order';
import { createMarket } from './controller/market';
import {redis} from './index'
import { createUser } from './controller/user';

export const processMessages = async ()=>{
    try {
        const message = await redis.rpop("messageQueue");
        if(message){
            const parsedData = JSON.parse(message);
            const { data, endPoint, eventId } = parsedData;
            switch (endPoint) {
              case "CREATE_USER":
                await createUser(data,eventId)
                break;
              case "CREATE_MARKET":
                await createMarket(data,eventId);
                break;
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
