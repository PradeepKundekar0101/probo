import { GlobalData, markets } from "../db";
import { message, publishMessage } from "../services/redis";
import { getSubs, getViews } from "../utils/youtube";

interface Settlement {
  marketId: string;
  winningOption: 'yes' | 'no';
  settledValue: number;
  expectedValue: number;
}

const settleBalances = (settlement: Settlement) => {
  const { marketId, winningOption } = settlement;

  Object.keys(GlobalData.stockBalances).forEach(userId => {
    const userBalance = GlobalData.stockBalances[userId][marketId];
    if (!userBalance) return;


    if (userBalance[winningOption]) {
      const winningQuantity = userBalance[winningOption].quantity;
      const payout = winningQuantity * 1000; 
      GlobalData.inrBalances[userId].balance += payout;
    }

    GlobalData.stockBalances[userId][marketId] = {
      yes: { quantity: 0, locked: 0 },
      no: { quantity: 0, locked: 0 }
    };
  });

  GlobalData.orderBook[marketId] = {
    yes: {},
    no: {}
  };

  publishMessage(
    message(200, "Market Settled", {
      marketId,
      result: winningOption,
      settledValue: settlement.settledValue,
      expectedValue: settlement.expectedValue
    }),
    "MARKET_SETTLEMENT"
  );
};

export const settleMarketsOnClose = async () => {
  try {
    const settlements: Settlement[] = [];

    await Promise.all(
      Object.keys(markets).map(async (marketId: string) => {
        const market = GlobalData.markets[marketId];
        
        // Check if market should be settled
        if (new Date(market.endTime).getTime() <= Date.now() && market.isOpen) {
          market.isOpen = false;
          let settledValue: number;
          let winningOption: 'yes' | 'no';

          try {
            switch (market.categoryType) {
              case "YT_VIEWS":
                settledValue = await getViews(market.sourceId!);
                winningOption = settledValue > market.expectedValue! ? "yes" : "no";
                break;

              case "YT_SUB":
                settledValue = await getSubs(market.sourceId!);
                winningOption = settledValue > market.expectedValue! ? "yes" : "no";
                break;

              default:
                console.error(`Unknown market category type: ${market.categoryType}`);
                return;
            }

            // Record settlement
            market.result = winningOption;
            market.settledValue = settledValue;

            settlements.push({
              marketId,
              winningOption,
              settledValue,
              expectedValue: market.expectedValue!
            });

          } catch (error) {
            console.error(`Error settling market ${marketId}:`, error);
            publishMessage(
              message(500, "Market Settlement Failed", {
                marketId,
                error: error instanceof Error ? error.message : 'Unknown error'
              }),
              "ADMIN_NOTIFICATION"
            );
          }
        }
      })
    );

    settlements.forEach(settlement => {
      settleBalances(settlement);
    });

    if (settlements.length > 0) {
      console.log('Markets settled:', settlements.map(s => s.marketId).join(', '));
    }

  } catch (error) {
    console.error('Error in market settlement process:', error);
    
    publishMessage(
      message(500, "Critical Settlement Failure", {
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      "ADMIN_NOTIFICATION"
    );
  }
};