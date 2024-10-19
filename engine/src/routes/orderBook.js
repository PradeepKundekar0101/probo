"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderBookRouter = void 0;
const express_1 = __importDefault(require("express"));
const orderBook_1 = require("../controller/orderBook");
exports.orderBookRouter = express_1.default.Router();
exports.orderBookRouter.get("/", orderBook_1.getOrderBook);
