import { OrderBook } from '../db/types';

const calculateMarketPrice = (stockSymbol: string, orderBook: OrderBook): { yes: number; no: number } => {
  const buyOrders = orderBook[stockSymbol]?.buy;
  const sellOrders = orderBook[stockSymbol]?.sell;

  if (!buyOrders || !sellOrders) {
    return { yes: 500, no: 500 }; 
  }

  const calculateWeightedAverage = (orders: { [price: number]: { total: number } }) => {
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

export default calculateMarketPrice;