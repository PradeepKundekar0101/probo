"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const balance_1 = require("./routes/balance");
const user_1 = require("./routes/user");
const onramp_1 = require("./routes/onramp");
const orderBook_1 = require("./routes/orderBook");
const order_1 = require("./routes/order");
const resetDB_1 = require("./utils/resetDB");
const market_1 = require("./routes/market");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post("/reset", (req, res) => {
    (0, resetDB_1.resetDB)();
    res.status(200);
});
app.get('/', (req, res) => {
    res.send("Options Trading App");
});
app.use('/user', user_1.userRouter);
app.use('/balance', balance_1.balanceRouter);
app.use('/onramp', onramp_1.onrampRouter);
app.use('/orderbook', orderBook_1.orderBookRouter);
app.use('/order', order_1.orderRouter);
app.use('/market', market_1.marketRouter);
exports.default = app;
