import { inrBalances, stockBalances } from "../db"
import { message, publishMessage } from "../services/redis"
export const createUser = async (userId:string,eventId:string)=>{
    try
    {
        if(inrBalances[userId])
            return publishMessage(message(400,"User name already taken",null),eventId)
        inrBalances[userId]={balance:0,locked:0}
        stockBalances[userId]={}
        publishMessage(message(201,"User created",inrBalances[userId]),eventId)
   }
    catch (error:any)
    {
        publishMessage(message(500,"An Error occured",{error:error.message}),eventId)
    }
}