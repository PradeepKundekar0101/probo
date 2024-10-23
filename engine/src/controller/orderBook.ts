import {  orderBook } from "../db"
import { message, publishMessage } from "../utils/publishResponse"
export const getOrderBook = async (eventId:string)=>{
    try
    {
        publishMessage(message(200,"Success",orderBook),eventId)
    }
    catch (error:any)
    {
        publishMessage(message(500,"An Error occured",{error:error.message}),eventId)
    }
}