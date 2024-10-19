"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketPrice = exports.settleMarket = exports.createMarket = void 0;
const db_1 = require("../db");
const api_util_1 = require("../utils/api.util");
const calculateMarketPrice_1 = __importDefault(require("../utils/calculateMarketPrice"));
exports.createMarket = (0, api_util_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { stockSymbol, title, description, startTime, endTime, initialYesTokens, initialNoTokens, } = req.body;
    if (db_1.orderBook[stockSymbol]) {
        return res.status(400).json({ error: "Market already exists" });
    }
    const market = {
        stockSymbol,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        yes: initialYesTokens,
        no: initialNoTokens,
        result: null,
    };
    db_1.markets[stockSymbol] = market;
    db_1.orderBook[stockSymbol] = {
        buy: {
            yes: {},
            no: {},
        },
        sell: {
            yes: {},
            no: {},
        }
    };
    db_1.currentMarketPrice[stockSymbol] = {
        yes: 500,
        no: 500
    };
    return (0, api_util_1.sendResponse)(res, 201, { data: "Market created successfully" });
}));
exports.settleMarket = (0, api_util_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { stockSymbol, result } = req.body;
    if (!db_1.markets[stockSymbol]) {
        return res.status(404).json({ error: "Market not found" });
    }
    if (result !== "yes" && result !== "no") {
        return res.status(400).json({ error: "Invalid result" });
    }
    db_1.markets[stockSymbol].result = result;
    for (const userId in db_1.stockBalances) {
        const userStocks = db_1.stockBalances[userId][stockSymbol];
        if (userStocks) {
            const winningStocks = userStocks[result];
            const losingStocks = userStocks[result === "yes" ? "no" : "yes"];
            if (winningStocks && winningStocks.quantity > 0) {
                const payout = winningStocks.quantity * 1000;
                if (!db_1.inrBalances[userId]) {
                    db_1.inrBalances[userId] = { balance: 0, locked: 0 };
                }
                db_1.inrBalances[userId].balance += payout;
            }
            userStocks.yes = { quantity: 0, locked: 0 };
            userStocks.no = { quantity: 0, locked: 0 };
        }
    }
    delete db_1.orderBook[stockSymbol];
    res.status(200).json({ data: "done" });
}));
exports.getMarketPrice = (0, api_util_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { stockSymbol } = req.params;
    console.log(db_1.markets);
    console.log(stockSymbol);
    if (!db_1.markets[stockSymbol]) {
        return (0, api_util_1.sendResponse)(res, 404, "Market not found");
    }
    const marketPrice = (0, calculateMarketPrice_1.default)(stockSymbol, db_1.orderBook);
    db_1.currentMarketPrice[stockSymbol] = marketPrice;
    return (0, api_util_1.sendResponse)(res, 200, marketPrice);
}));
