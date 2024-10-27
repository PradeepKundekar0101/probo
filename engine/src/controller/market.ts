import { GlobalData, orderBook } from "../db"
import { Market } from "../types/market"
import { message, publishMessage } from "../services/redis"
import { produceMessage } from "../services/kafka"
export const createMarket = async (data:Market,eventId:string)=>{
    const {startTime,stockSymbol,endTime,title,description,result,categoryType} = data
    try
    {
        if(GlobalData.markets[stockSymbol]) 
            return publishMessage(message(409,`${stockSymbol} already taken `,null),eventId)
        GlobalData.markets[stockSymbol]={ startTime,stockSymbol,description,endTime,title,result,categoryType}
        GlobalData.orderBook[stockSymbol]={
            yes:{},
            no:{}
        }
        
        publishMessage(message(201,"Succesfully created market"+stockSymbol,GlobalData.markets[stockSymbol]),eventId)
    }
    catch (error:any)
    {
        publishMessage(message(500,"An Error occured",{error:error.message}),eventId)
    }
}