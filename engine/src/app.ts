import {redis} from './index'
import { processData } from './utils/processData';
export const processMessages = async ()=>{
    try {
        const message = await redis.rpop("messageQueue");
        if(message)
            processData(message)
    } catch (error) {
        console.log(error)
    }
}   