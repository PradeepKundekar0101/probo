import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/api.util";
import dotenv from "dotenv"

dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET;
export interface AuthRequest extends Request {
  headers: {
    authorization?: string;
  };
  userId?: string;
}
export const isAuthenticated = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers.authorization) {
    sendResponse(res, 401, "Authorization header is missing");
    return;
  }
  const authToken = req.headers.authorization.split(" ")[1];
  if (!authToken) {
    sendResponse(res, 401, "Auth toke is missing");
    return;
  }
  jwt.verify(authToken, JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      sendResponse(res, 403, "Forbidden");
      return;
    }
    console.log(user)
    req.userId = user.id;
    next();
  });
};
