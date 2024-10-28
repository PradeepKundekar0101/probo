import { GlobalData } from "../db"
import { message, publishMessage } from "../services/redis"
export const createUser = async (userId:string,eventId:string)=>{
    try
    {
        if(GlobalData.inrBalances[userId])
            return publishMessage(message(400,"User name already taken",null),eventId)
        GlobalData.inrBalances[userId]={balance:0,locked:0}
        GlobalData.stockBalances[userId]={}
        publishMessage(message(201,"User created",GlobalData.inrBalances[userId]),eventId)
   }
    catch (error:any)
    {
        publishMessage(message(500,"An Error occured",{error:error.message}),eventId)
    }
}