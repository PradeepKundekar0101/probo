"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const express_1 = __importDefault(require("express"));
const order_1 = require("../controller/order");
exports.orderRouter = express_1.default.Router();
exports.orderRouter.post("/buy", order_1.buyStock);
exports.orderRouter.post("/sell", order_1.sellStock);
exports.orderRouter.post("/cancel", order_1.cancelOrder);
exports.orderRouter.get("/:user", order_1.getOrderByUserId);
