"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceRouter = void 0;
const express_1 = __importDefault(require("express"));
const balance_1 = require("../controller/balance");
exports.balanceRouter = express_1.default.Router();
exports.balanceRouter.get("/inr/:userId", balance_1.getBalance);
exports.balanceRouter.get("/inr/", balance_1.getBalanceAll);
exports.balanceRouter.get("/stock/:userId", balance_1.getStockBalance);
exports.balanceRouter.get("/stock/", balance_1.getStockBalanceAll);
