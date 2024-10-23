import express from "express"
import Redis from "ioredis"
const app = express()

const redis = new Redis({host:"localhost",port:6379})

const PORT  = process.env.PORT || 3001;

app.listen(PORT,()=>{
    console.log("DB Worker running at PORT "+PORT)
})