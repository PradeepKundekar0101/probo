import { inrBalances } from "../db"
import { message, publishMessage } from "../utils/publishResponse"
export const onRamp = async (data:{userId:string,amount:number},eventId:string)=>{
    try
    {
        const {userId,amount} = data;
        console.log(`Onramping Rs ${amount} to user ${userId}`)
        if(!inrBalances[userId])
            return publishMessage(message(404,`${userId} does not exist`,null),eventId)
        inrBalances[userId].balance+=amount;
        publishMessage(message(200,"Succesfully Onramped Rs"+amount,inrBalances[userId]),eventId)
    }
    catch (error:any)
    {
        publishMessage(message(500,"An Error occured",{error:error.message}),eventId)
    }
}