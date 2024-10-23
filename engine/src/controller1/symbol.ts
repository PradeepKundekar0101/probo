// import { Response, Request } from "express";
// import { catchAsync, sendResponse } from "../utils/api.util";
// import { INR_BALANCES, STOCK_SYMBOLS,ORDERBOOK } from "../db";
// import AppError from "../utils/AppError";

// export const createSymbol = catchAsync(async (req: Request, res: Response) => {
//     const { stockSymbol } = req.params;
//     if (!stockSymbol) {
//         return sendResponse(res,404,{message:"Stock symbol not found"})
//     }
//     if (ORDERBOOK[stockSymbol]) {
//         return sendResponse(res,400,{message:"Stock symbol already taken"})
//     }
//     ORDERBOOK[stockSymbol] = { yes:{},no:{}};
//     return sendResponse(res, 201, {
//         message: `${stockSymbol} added successfully`,
//         data: STOCK_SYMBOLS[stockSymbol],
//     });
// });
