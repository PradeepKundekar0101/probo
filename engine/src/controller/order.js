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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderByUserId = exports.mintNewTokens = exports.cancelOrder = exports.sellStock = exports.buyStock = void 0;
const db_1 = require("../db");
const api_util_1 = require("../utils/api.util");
const generateOrderId_1 = require("../utils/generateOrderId");
exports.buyStock = (0, api_util_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { userId, stockSymbol, quantity, price, stockType } = req.body;
    quantity = Number(quantity);
    price = Number(price);
    if (!userId ||
        !stockSymbol ||
        !quantity ||
        price === undefined ||
        !stockType) {
        return (0, api_util_1.sendResponse)(res, 400, "Missing parameter");
    }
    if (!db_1.orderBook[stockSymbol]) {
        return (0, api_util_1.sendResponse)(res, 404, "Market not found");
    }
    const totalCost = quantity * price;
    if (!db_1.inrBalances[userId] || db_1.inrBalances[userId].balance < totalCost) {
        return (0, api_util_1.sendResponse)(res, 400, "Insufficient INR balance");
    }
    if (!db_1.stockBalances[userId]) {
        db_1.stockBalances[userId] = {};
    }
    if (!db_1.stockBalances[userId][stockSymbol]) {
        db_1.stockBalances[userId][stockSymbol] = {
            yes: { quantity: 0, locked: 0 },
            no: { quantity: 0, locked: 0 },
        };
    }
    let availableStocks = quantity;
    let totalTradeQty = 0;
    const isLimitOrder = db_1.currentMarketPrice[stockSymbol][stockType] !== price;
    if (db_1.orderBook[stockSymbol]["sell"][stockType][price] &&
        db_1.orderBook[stockSymbol]["sell"][stockType][price].total > 0) {
        const orders = db_1.orderBook[stockSymbol]["sell"][stockType][price].orders;
        for (const sellerId in orders) {
            if (availableStocks === 0)
                break;
            const sellerQuantity = orders[sellerId];
            const tradeQuantity = Number(Math.min(availableStocks, sellerQuantity));
            // Execute the trade
            totalTradeQty += tradeQuantity;
            availableStocks -= tradeQuantity;
            // Update seller's balances
            db_1.inrBalances[sellerId].balance += tradeQuantity * price;
            db_1.stockBalances[sellerId][stockSymbol][stockType].locked -=
                tradeQuantity;
            // Update buyer's stock balance
            db_1.stockBalances[userId][stockSymbol][stockType].quantity +=
                tradeQuantity;
            // Update orderbook
            db_1.orderBook[stockSymbol]["sell"][stockType][price].total -=
                tradeQuantity;
            db_1.orderBook[stockSymbol]["sell"][stockType][price].orders[sellerId] -= tradeQuantity;
            if (db_1.orderBook[stockSymbol]["sell"][stockType][price].orders[sellerId] === 0) {
                delete db_1.orderBook[stockSymbol]["sell"][stockType][price]
                    .orders[sellerId];
            }
        }
        if (db_1.orderBook[stockSymbol]["sell"][stockType][price].total === 0) {
            delete db_1.orderBook[stockSymbol]["sell"][stockType][price];
        }
    }
    if (availableStocks > 0) {
        if (isLimitOrder) {
            db_1.stockBalances[userId][stockSymbol][stockType].quantity +=
                totalTradeQty;
            db_1.inrBalances[userId].locked += availableStocks * price;
        }
        else {
            db_1.stockBalances[userId][stockSymbol][stockType].quantity +=
                availableStocks;
            if (availableStocks > db_1.markets[stockSymbol][stockType]) {
                (0, exports.mintNewTokens)(stockSymbol, stockType, availableStocks - db_1.markets[stockSymbol][stockType]);
            }
            db_1.markets[stockSymbol][stockType] -= availableStocks;
        }
    }
    db_1.inrBalances[userId].balance -= totalCost;
    if (isLimitOrder) {
        if (!db_1.orderBook[stockSymbol]["buy"]) {
            db_1.orderBook[stockSymbol]["buy"] = {
                yes: {},
                no: {},
            };
        }
        if (!db_1.orderBook[stockSymbol]["buy"][stockType][price]) {
            db_1.orderBook[stockSymbol]["buy"][stockType][price] = {
                total: quantity,
                orders: {
                    [userId]: quantity,
                },
            };
        }
        else {
            db_1.orderBook[stockSymbol]["buy"][stockType][price].total +=
                quantity;
            db_1.orderBook[stockSymbol]["buy"][stockType][price].orders[userId] = quantity;
        }
    }
    db_1.ordersList.push({
        id: (0, generateOrderId_1.generateOrderId)(),
        userId,
        price,
        createdAt: new Date(),
        quantity,
        stockSymbol,
        stockType,
        totalPrice: price * quantity,
        orderType: "buy",
        status: "executed",
    });
    return (0, api_util_1.sendResponse)(res, 200, {
        message: "Buy order processed successfully",
    });
}));
exports.sellStock = (0, api_util_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { userId: sellerId, stockSymbol, quantity, price, stockType } = req.body;
    quantity = Number(quantity);
    price = Number(price);
    if (!sellerId ||
        !stockSymbol ||
        !quantity ||
        price === undefined ||
        !stockType) {
        return (0, api_util_1.sendResponse)(res, 400, "Missing parameters");
    }
    if (!db_1.orderBook[stockSymbol]) {
        return res.status(404).json({ error: "Market not found" });
    }
    if (!db_1.stockBalances[sellerId] ||
        !db_1.stockBalances[sellerId][stockSymbol] ||
        db_1.stockBalances[sellerId][stockSymbol][stockType].quantity <
            quantity) {
        return res.status(400).json({ error: "Insufficient stock balance" });
    }
    let availableStocks = quantity;
    let totalTradeQty = 0;
    if (db_1.orderBook[stockSymbol]["buy"][stockType][price] &&
        db_1.orderBook[stockSymbol]["buy"][stockType][price].total > 0) {
        const orders = db_1.orderBook[stockSymbol]["buy"][stockType][price].orders;
        for (const buyerId in orders) {
            if (availableStocks === 0)
                break;
            const sellerQuantity = orders[buyerId];
            const tradeQuantity = Math.min(availableStocks, sellerQuantity);
            // Execute the trade
            totalTradeQty += tradeQuantity;
            availableStocks -= tradeQuantity;
            // Update seller's balances
            db_1.inrBalances[buyerId].locked -= tradeQuantity * price;
            db_1.stockBalances[buyerId][stockSymbol][stockType].quantity +=
                tradeQuantity;
            // Update seller's stock balance
            db_1.stockBalances[sellerId][stockSymbol][stockType].quantity -=
                tradeQuantity;
            // Update orderbook
            db_1.orderBook[stockSymbol]["buy"][stockType][price].total -=
                tradeQuantity;
            db_1.orderBook[stockSymbol]["buy"][stockType][price].orders[buyerId] -= tradeQuantity;
            if (db_1.orderBook[stockSymbol]["buy"][stockType][price].orders[buyerId] === 0) {
                delete db_1.orderBook[stockSymbol]["buy"][stockType][price]
                    .orders[buyerId];
            }
        }
        if (db_1.orderBook[stockSymbol]["buy"][stockType][price].total === 0) {
            delete db_1.orderBook[stockSymbol]["buy"][stockType][price];
        }
    }
    //Lock the user's stock balance
    db_1.stockBalances[sellerId][stockSymbol][stockType].quantity -=
        availableStocks;
    db_1.stockBalances[sellerId][stockSymbol][stockType].locked +=
        availableStocks;
    console.log(availableStocks);
    if (availableStocks > 0) {
        if (!db_1.orderBook[stockSymbol]["sell"][stockType][price]) {
            db_1.orderBook[stockSymbol]["sell"][stockType][price] = {
                total: availableStocks,
                orders: {
                    [sellerId]: availableStocks,
                },
            };
        }
        else {
            db_1.orderBook[stockSymbol]["sell"][stockType][price].total +=
                availableStocks;
            db_1.orderBook[stockSymbol]["sell"][stockType][price].orders[sellerId] += availableStocks;
        }
    }
    db_1.ordersList.push({
        id: (0, generateOrderId_1.generateOrderId)(),
        userId: sellerId,
        price,
        createdAt: new Date(),
        quantity: availableStocks,
        stockSymbol,
        stockType,
        totalPrice: price * availableStocks,
        orderType: "sell",
        status: "executed",
    });
    return (0, api_util_1.sendResponse)(res, 200, { data: "Sell order placed successfully" });
}));
exports.cancelOrder = (0, api_util_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.body;
    if (orderId === undefined) {
        return res.status(400).json({ error: "Missing parameters" });
    }
    const order = db_1.ordersList.filter((order) => order.id == orderId);
    if (order.length == 0)
        return (0, api_util_1.sendResponse)(res, 404, "Order not found");
    if (order[0].orderType == "buy") {
        return (0, api_util_1.sendResponse)(res, 400, "Cannot cancel buy orders");
    }
    const { userId, price, stockSymbol, stockType, quantity, totalPrice } = order[0];
    db_1.orderBook[stockSymbol]["sell"][stockType][price].total -=
        totalPrice;
    db_1.orderBook[stockSymbol]["sell"][stockType][price].orders[userId] -= totalPrice;
    if (db_1.orderBook[stockSymbol]["sell"][stockType][price].orders[userId] === 0) {
        delete db_1.orderBook[stockSymbol]["sell"][stockType][price].orders[userId];
    }
    const index = db_1.ordersList.findIndex((order) => order.id === orderId);
    db_1.ordersList.splice(index, 1);
    return (0, api_util_1.sendResponse)(res, 200, { message: "Order cancelled" });
}));
const mintNewTokens = (stockSymbol, stockType, quantity) => {
    db_1.markets[stockSymbol][stockType] += quantity;
};
exports.mintNewTokens = mintNewTokens;
exports.getOrderByUserId = (0, api_util_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.params;
    if (user === undefined) {
        return res.status(400).json({ error: "Missing parameters" });
    }
    const orders = db_1.ordersList.filter((order) => order.userId == user);
    return (0, api_util_1.sendResponse)(res, 200, { data: orders });
}));
