import { Request, Response } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import { prismaClient } from "../services/prisma";
import {compare, hash} from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { pushToQueue } from "../services/redis";
dotenv.config()
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
    const user = await prismaClient.user.create({data:{
        username,password:hashedPassword,email,phonenumber
    }})
    // await prismaClient.inrBalance.create({
    //     data:{userId:user.id,locked:0,balance:0}
    // })
    pushToQueue("CREATE_USER",user.id)
    const token = jwt.sign({id:user.id},JWT_SECRET!)
    return sendResponse(res,201,{message:"User created",data:{
        user,
        token
    }})

})


export const login = catchAsync(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    // Check if both username and password are provided
    if (!username || !password) {
        sendResponse(res, 400, { message: "Username and password are required", data: "" });
        return;
    }


    const user = await prismaClient.user.findFirst({
        where: { username }
    });

    if (!user) {
        sendResponse(res, 404, { message: "User not found", data: "" });
        return;
    }


    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
        sendResponse(res, 401, { message: "Invalid password", data: "" });
        return;
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET!, { expiresIn: '1h' });

    // Send response with user data and token
    return sendResponse(res, 200, {
        message: "Login successful",
        data: {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phonenumber: user.phonenumber
            },
            token
        }
    });
});