export function isMarketOpen(symbol: string,MARKET_INFO:any): boolean {
    const now = Date.now();
    return MARKET_INFO[symbol] && now >= MARKET_INFO[symbol].startTime && now < MARKET_INFO[symbol].endTime;
  }
  
  import { INR_BALANCES, ORDERBOOK, STOCK_BALANCES } from '../db/index';

interface Market {
  stockSymbol: string;
  startTime:number;
  endTime: number;
  result?: 'yes' | 'no' ;
}
export const settleMarket = (market: Market) => {
  const { stockSymbol, result } = market;

  if (result === null) {
    throw new Error('Market result must be set before settlement');
  }

  // Clear the order book
  delete ORDERBOOK[stockSymbol];

  // Settle user balances
  for (const userId in STOCK_BALANCES) {
    if (STOCK_BALANCES[userId][stockSymbol]) {
      const userStockBalance = STOCK_BALANCES[userId][stockSymbol];

      // Calculate total stocks (available + locked)
      const totalYes = userStockBalance.yes.quantity + userStockBalance.yes.locked;
      const totalNo = userStockBalance.no.quantity + userStockBalance.no.locked;

      // Settle INR balances
      if (result === 'yes') {
        INR_BALANCES[userId].balance += totalYes * 1000; // 10 INR per winning stock
      } else {
        INR_BALANCES[userId].balance += totalNo * 1000; // 10 INR per winning stock
      }

      // Clear locked INR balances
      INR_BALANCES[userId].balance += INR_BALANCES[userId].locked;
      INR_BALANCES[userId].locked = 0;

      // Clear stock balances
      delete STOCK_BALANCES[userId][stockSymbol];
    }
  }
};

// Function to check and settle markets
// export const checkAndSettleMarkets = (markets: Market[],marketInfo:any) => {
//   const now = new Date();
//   markets.forEach(market => {
//     if (!isMarketOpen(market.stockSymbol,)) {
//       settleMarket(market);
//     }
//   });
// };