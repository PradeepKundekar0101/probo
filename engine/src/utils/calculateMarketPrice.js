"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calculateMarketPrice = (stockSymbol, orderBook) => {
    var _a, _b;
    const buyOrders = (_a = orderBook[stockSymbol]) === null || _a === void 0 ? void 0 : _a.buy;
    const sellOrders = (_b = orderBook[stockSymbol]) === null || _b === void 0 ? void 0 : _b.sell;
    if (!buyOrders || !sellOrders) {
        return { yes: 500, no: 500 };
    }
    const calculateWeightedAverage = (orders) => {
        let totalVolume = 0;
        let weightedSum = 0;
        Object.entries(orders).forEach(([price, { total }]) => {
            totalVolume += total;
            weightedSum += total * Number(price);
        });
        return totalVolume > 0 ? weightedSum / totalVolume : 500;
    };
    const yesBuyPrice = calculateWeightedAverage(buyOrders.yes);
    const yesSellPrice = calculateWeightedAverage(sellOrders.yes);
    const noBuyPrice = calculateWeightedAverage(buyOrders.no);
    const noSellPrice = calculateWeightedAverage(sellOrders.no);
    const yesPrice = (yesBuyPrice + yesSellPrice) / 2;
    const noPrice = (noBuyPrice + noSellPrice) / 2;
    const totalPrice = yesPrice + noPrice;
    const normalizedYesPrice = Math.round((yesPrice / totalPrice) * 1000);
    const normalizedNoPrice = 1000 - normalizedYesPrice;
    return { yes: normalizedYesPrice, no: normalizedNoPrice };
};
exports.default = calculateMarketPrice;
