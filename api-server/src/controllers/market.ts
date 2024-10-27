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
  categoryType:string
}

export const createMarket = catchAsync(async (req: Request, res: Response) => {
  const { 
    stockSymbol, 
    description, 
    startTime, 
    endTime,
    categoryId,
    categoryType
  }: CreateMarketRequest = req.body;

  if (  !stockSymbol || !description || !startTime || !endTime || !categoryId || !categoryType) {
    return sendResponse(res, 400, {
      message: "All fields ( stockSymbol, description, startTime, endTime, categoryId,categoryType) are required",
      data: null,
    });
  }
  
  try {
    const image = req.file as unknown as Express.Multer.File;
    const fileName = `${stockSymbol}-${image.originalname}`;
    const destination = await putObjectURL(image, fileName);
    const fileUrl = getObjectURL(destination);
    const existingStockSymbol = await prismaClient.market.findFirst({where:{
      stockSymbol
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
        stockSymbol,
        description,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        thumbnail:fileUrl,
        categoryId, 
        categoryType
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
  const markets = await prismaClient.market.findMany({})  
  sendResponse(res,200,markets)
})
export const getCategories = catchAsync(async(req:Request,res:Response)=>{
  const categories = await prismaClient.category.findMany({})  
  sendResponse(res,200,categories)
})