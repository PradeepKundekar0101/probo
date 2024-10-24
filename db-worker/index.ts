import express from "express"
import Redis from "ioredis"
const app = express()

const redis = new Redis({host:"localhost",port:6379})


const PORT  = process.env.PORT || 8004;

app.listen(PORT,()=>{
    console.log("DB Worker running at PORT "+PORT)
})
const  processMessage = async()=>{
    const message = await redis.rpop("dbWriteQueue")
    if(message){
        const {eventType,data} = JSON.parse(message)
        
    }
}
while(true){
    processMessage()
}