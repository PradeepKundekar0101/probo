import { Request, Response } from "express";
import { catchAsync, sendResponse } from "../utils/api.util";
import { prismaClient } from "../services/prisma";
import { getObjectURL, putObjectURL } from "../services/aws";
import { pushToQueue } from "../services/redis";

interface CreateMarketRequest {
  stockSymbol: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  categoryId: string;
  sourceOfTruth:string
}

export const createMarket = catchAsync(async (req: Request, res: Response) => {
  const { 
    title, 
    description, 
    startTime, 
    endTime,
    categoryId,
    sourceOfTruth
  }: CreateMarketRequest = req.body;

  if (  !title || !description || !startTime || !endTime || !categoryId || !sourceOfTruth) {
    return sendResponse(res, 400, {
      message: "All fields ( title, description, startTime, endTime, categoryId,categoryType) are required",
      data: null,
    });
  }
  
  try {
    const image = req.file as unknown as Express.Multer.File;
    const fileName = `${title}-${image.originalname}`; 
    const destination = await putObjectURL(image, fileName);
    const fileUrl = getObjectURL(destination);
    const existingStockSymbol = await prismaClient.market.findFirst({where:{
      title
    }})


    if (existingStockSymbol) {
      return sendResponse(res, 409, {
        message: "Market already exists",
        data: null,
      });
    }

    const existingCategory = await prismaClient.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return sendResponse(res, 404, {
        message: "Category not found",
        data: null,
      });
    }


    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (parsedEndTime <= parsedStartTime) {
      return sendResponse(res, 400, {
        message: "End time must be after start time",
        data: null,
      });
    }
    const market = await prismaClient.market.create({
      data: {
        title,
        description,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        thumbnail:fileUrl,
        categoryId, 
        sourceOfTruth
      }
    });

    pushToQueue("CREATE_MARKET",{...req.body,stockSymbol:market.id})

    return sendResponse(res, 201, {
      message: "Market created successfully",
      data: market,
    });
  } catch (error) {
    console.error('Error creating market:', error);
    
    return sendResponse(res, 500, {
      message: error instanceof Error ? error.message : "Failed to create market",
      data: null,
    });
  }
});


export const createCategory = catchAsync(async(req:Request,res:Response)=>{
  const {categoryName} = req.body

  const image = req.file as unknown as Express.Multer.File;
  console.log(image)
  if (!categoryName || !image) {
    sendResponse(res,400, "Please provide title and image");
    return;
  }
  const fileName = `${categoryName}-${image.originalname}`;
  const destination = await putObjectURL(image, fileName);
  const fileUrl = getObjectURL(destination);

  const category = await  prismaClient.category.create({
    data: {
      categoryName,
      icon:fileUrl,
    }
  });

  return sendResponse(res, 201, category);
})

export const getMarkets = catchAsync(async(req:Request,res:Response)=>{
  const categoryId=req.query.categoryId
  let markets;
  if(!categoryId){
      markets = await prismaClient.market.findMany({})  
  }else{
    markets = await prismaClient.market.findMany({where:{categoryId:categoryId as string}})
  }
  sendResponse(res,200,markets)
})
export const getCategories = catchAsync(async(req:Request,res:Response)=>{
  const categories = await prismaClient.category.findMany({})  
  sendResponse(res,200,categories)
})

export const settleMarket = catchAsync(async(req:Request,res:Response)=>{
  const {marketId,value}:{
    marketId:string,
    value:"yes"|"no"
  } = req.body;
  const market = await prismaClient.market.findFirst({where:{id:marketId}})
  if(!market){
    sendResponse(res,404,{message:"Market not found"})
    return;
  }
  const currentTime = new Date().getTime()
  const endTime = new Date(market.endTime).getTime();
  if(endTime>currentTime){
    sendResponse(res,400,{message:"Market not closed yet"})
    return
  }
  console.log(value)
  const updated = await prismaClient.market.update({
    where:{id:marketId},data:{
      result:value
    }
  })
  console.log(updated)
  pushToQueue("SETTLE_MARKET",{result:value,stockSymbol:marketId},res)

})


export const getMarketById = async (req:Request,res:Response)=>{
    const marketId = req.params.marketId;
    if(!marketId){
      sendResponse(res,400,{data:"Provide marketId"})
      return
    }
    const markets = await prismaClient.market.findFirst({where:{id:marketId}})
    sendResponse(res,200,{markets})
}
export const getPrices = async (req:Request,res:Response)=>{
    const marketId = req.params.marketId;
    if(!marketId){
      sendResponse(res,400,{data:"Provide marketId"})
      return
    }
    pushToQueue("GET_PRICE",marketId,res)
}