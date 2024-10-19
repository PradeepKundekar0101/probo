"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDB = void 0;
const index_1 = require("../db/index");
const resetDB = () => {
    for (const key in index_1.orderBook) {
        delete index_1.orderBook[key];
    }
    for (const key in index_1.inrBalances) {
        delete index_1.inrBalances[key];
    }
    for (const key in index_1.stockBalances) {
        delete index_1.stockBalances[key];
    }
    // for (const key in STOCK_SYMBOLS) {
    //   delete STOCK_SYMBOLS[key];
    // }
    console.log("All data has been reset to empty objects.");
};
exports.resetDB = resetDB;
