import {  GlobalData } from "../db"
import { message, publishMessage } from "../services/redis"
export const getOrderBook = async (eventId:string)=>{
    try
    {
        publishMessage(message(200,"Success", GlobalData.orderBook),eventId)
    }
    catch (error:any)
    {
        publishMessage(message(500,"An Error occured",{error:error.message}),eventId)
    }
}