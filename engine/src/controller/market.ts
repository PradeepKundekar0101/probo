import { markets, orderBook } from "../db"
import { Market } from "../db/types"
import { message, publishMessage } from "../utils/publishResponse"
export const createMarket = async (data:Market,eventId:string)=>{
    const {startTime,stockSymbol,endTime,title,description,result} = data
    try
    {
        if(markets[stockSymbol]) return publishMessage(message(400,`${stockSymbol} already taken `,null),eventId)
        markets[stockSymbol]={ startTime,stockSymbol,description,endTime,title,result}
        orderBook[stockSymbol]={reverse:{yes:{},no:{}},direct:{yes:{},no:{}}}
        publishMessage(message(201,"Succesfully created market"+stockSymbol,markets[stockSymbol]),eventId)
    }
    catch (error:any)
    {
        publishMessage(message(500,"An Error occured",{error:error.message}),eventId)
    }
}