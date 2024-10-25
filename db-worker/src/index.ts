import express from "express"
import { startConsumeMessages } from "./services/kafka";
const app = express()
const PORT  = process.env.PORT || 8004;
startConsumeMessages()
app.listen(PORT,()=>{
    console.log("DB Worker running at PORT "+PORT)
})
