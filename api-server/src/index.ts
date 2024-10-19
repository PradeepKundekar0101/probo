import express from "express"
import Redis from "ioredis"
const app = express()
const redis = new Redis({
    port:6379,
    host:"localhost"
})

app.listen(8000,()=>{
    console.log("API Server running at port "+8000)
})