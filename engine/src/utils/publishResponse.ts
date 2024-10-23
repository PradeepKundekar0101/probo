import { redis } from ".."
interface MessageType{
    statusCode:number,
    message:string,
    data:null|Object
}
export const publishMessage = async (message:MessageType,eventId:string)=>{
    try {
        const parsedMessage = JSON.stringify(message)
        await redis.publish(eventId,parsedMessage)
    } catch (error) {
        console.log(error)
    }
} 
export const message = (statusCode:number,message:string,data:null | Object)=>{
    return {
        statusCode,message,data
    }
}