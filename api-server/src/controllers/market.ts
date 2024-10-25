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
}

export const createMarket = catchAsync(async (req: Request, res: Response) => {
  const { 
    stockSymbol, 
    title, 
    description, 
    startTime, 
    endTime,
    categoryId 
  }: CreateMarketRequest = req.body;

  if (!stockSymbol || !title || !description || !startTime || !endTime || !categoryId) {
    return sendResponse(res, 400, {
      message: "All fields (stockSymbol, title, description, startTime, endTime, categoryId) are required",
      data: null,
    });
  }

  try {
    const existingStockSymbol = await prismaClient.stockSymbol.findUnique({
      where: { stockSymbol },
    });

    if (existingStockSymbol) {
      return sendResponse(res, 409, {
        message: "Stock already exists",
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
        symbol: stockSymbol,
        categoryId, 
      }
    });

    pushToQueue("CREATE_MARKET",req.body)

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


export const validateMarketData = (data: CreateMarketRequest): boolean => {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error('Invalid date format');
  }

  if (endTime <= startTime) {
    throw new Error('End time must be after start time');
  }

  if (startTime < new Date()) {
    throw new Error('Start time cannot be in the past');
  }

  return true;
};

export const createCategory = catchAsync(async(req:Request,res:Response)=>{
  const {categoryName,categoryType} = req.body
 
  const image = req.file as unknown as Express.Multer.File;
  if (!categoryName || !image) {
    sendResponse(res,400, "Please provide title and image");
    return;
  }
  const fileName = `${categoryName}-${image.originalname}`;
  const destination = await putObjectURL(image, fileName);
  const fileUrl = getObjectURL(destination);

  const category = await  prismaClient.category.create({
    data: {
      categoryType,
      categoryName,
      icon:fileUrl,
    }
  });

  return sendResponse(res, 201, category);
})