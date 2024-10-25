import { Request, Response } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import { prismaClient } from "../services/prisma";
import {hash} from "bcrypt"
import jwt from "jsonwebtoken"
const JWT_SECRET = process.env.JWT_SECRET;

export const createUser = catchAsync(async(req:Request,res:Response)=>{
    const {username,phonenumber,email,password} = req.body;
    if(!username || !phonenumber || !email || !password)
    {
        sendResponse(res,400,{message:"All fields are required",data:""})
        return;
    }
    const existingUserWithUserName = await prismaClient.user.findFirst({
        where:{
            username 
        }
    })
    if(existingUserWithUserName){
        sendResponse(res,409,{message:"User name already",data:""})
        return
    }
    const existingUserWithEmail = await prismaClient.user.findFirst({
        where:{
            email 
        }
    })
    if(existingUserWithEmail){
        sendResponse(res,409,{message:"Email already",data:""})
        return
    }
    const existingUserWithPhonenumber = await prismaClient.user.findFirst({
        where:{
            phonenumber 
        }
    })
    if(existingUserWithPhonenumber){
        sendResponse(res,409,{message:"Phonenumber already",data:""})
        return
    }  
    const hashedPassword = await hash(password,10)
    const token = jwt.sign("",JWT_SECRET!)
    const user = await prismaClient.user.create({data:{
        username,password,email,phonenumber
    }})
    return sendResponse(res,201,{message:"User created",data:{
        user,
        token
    }})
    

})