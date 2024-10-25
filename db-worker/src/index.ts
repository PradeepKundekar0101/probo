import express from "express"
import { PrismaClient } from "@prisma/client";
const app = express()
export const prismaClient = new PrismaClient()
const PORT  = process.env.PORT || 8004;

app.listen(PORT,()=>{
    console.log("DB Worker running at PORT "+PORT)
})
