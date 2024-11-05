import { GlobalData } from "../db"
import { Market } from "../types/market"
import { message, publishMessage } from "../services/redis"
import { produceMessage } from "../services/kafka"
import moment from "moment"
import { OrderListItem } from "../types/orderList"

export const createMarket = async (data: Market, eventId: string) => {
    const { startTime, stockSymbol, endTime, title, description, sourceOfTruth } = data
    try {
        if (GlobalData.markets[stockSymbol])
            return publishMessage(message(409, `${stockSymbol} already taken `, null), eventId)
        GlobalData.markets[stockSymbol] = { startTime, stockSymbol, description, endTime, title, sourceOfTruth, tradersCnt: 0, isOpen: true, result: null }
        GlobalData.orderBook[stockSymbol] = {
            yes: {},
            no: {}
        }

        publishMessage(message(201, "Successfully created market " + stockSymbol, GlobalData.markets[stockSymbol]), eventId)
    }
    catch (error: any) {
        publishMessage(message(500, "An Error occurred", { error: error.message }), eventId)
    }
}

interface SettleData { stockSymbol: string, result: "yes" | "no" }

export const settleMarket = async (data: SettleData, eventId: string) => {
    const { stockSymbol, result } = data
    try {
        // Validation checks
        if (!GlobalData.markets[stockSymbol]) {
            return publishMessage(message(403, "Stock symbol not found", null), eventId)
        }
        if (GlobalData.markets[stockSymbol].result) {
            return publishMessage(message(400, "Market is already settled", null), eventId)
        }
        if (moment(GlobalData.markets[stockSymbol].endTime).unix() > moment().unix()) {
            return publishMessage(message(400, "Market has not ended yet", null), eventId)
        }

        // Update market status
        GlobalData.markets[stockSymbol].isOpen = false
        GlobalData.markets[stockSymbol].result = result

        // Process user balances and positions
        for (const [userId, userStocks] of Object.entries(GlobalData.stockBalances)) {
            if (userStocks[stockSymbol]) {
                const stockPosition = userStocks[stockSymbol]
                
                // Initialize user balance if doesn't exist
                if (!GlobalData.inrBalances[userId]) {
                    GlobalData.inrBalances[userId] = {
                        balance: 0,
                        locked: 0
                    }
                }

                // Calculate winnings
                if (result === "yes" && stockPosition.yes.quantity > 0) {
                    const winnings = stockPosition.yes.quantity * 1000
                    GlobalData.inrBalances[userId].balance += winnings
                } else if (result === "no" && stockPosition.no.quantity > 0) {
                    const winnings = stockPosition.no.quantity * 1000
                    GlobalData.inrBalances[userId].balance += winnings
                }

                // Return locked funds from unfilled orders
                const unfilledOrders = GlobalData.ordersList
                    .filter(order => 
                        order.stockSymbol === stockSymbol && 
                        order.userId === userId &&
                        order.quantity > order.tradedQuantity
                    );

                // Use Set to remove duplicates based on orderId
                const uniqueOrders = Array.from(new Set(unfilledOrders.map(order => order.id)))
                    .map(orderId => unfilledOrders.find(order => order.id === orderId));

                const lockedFundsToReturn = uniqueOrders.reduce((sum: number, order: OrderListItem | undefined) => {
                    if (!order) return sum;
                    const unfilledQuantity = order.quantity - order.tradedQuantity;
                    return sum + (unfilledQuantity * order.price * 100);
                }, 0);

                GlobalData.inrBalances[userId].balance += lockedFundsToReturn;
                GlobalData.inrBalances[userId].locked -= lockedFundsToReturn;

                // Remove the stock position
                delete GlobalData.stockBalances[userId][stockSymbol];

                // Clean up empty user stock balances
                if (Object.keys(GlobalData.stockBalances[userId]).length === 0) {
                    delete GlobalData.stockBalances[userId];
                }
            }
        }

        // Clean up market data
        delete GlobalData.orderBook[stockSymbol];

        // Process order list and send to Kafka
        const uniqueOrderIds = new Set<string>();
        GlobalData.ordersList = GlobalData.ordersList.filter((order) => {
            if (order.stockSymbol === stockSymbol) {
                if (!uniqueOrderIds.has(order.id)) {
                    uniqueOrderIds.add(order.id);
                    produceMessage(JSON.stringify({
                        message: {
                            operation: "INSERT_ORDERITEM",
                            data: { ...order, marketId: order.stockSymbol }
                        }
                    }));
                }
                return false;
            }
            return true;
        });

        publishMessage(
            message(
                200,
                `Successfully settled market ${stockSymbol} with result ${result}`,
                GlobalData.markets[stockSymbol]
            ),
            eventId
        );
    } catch (error: any) {
        publishMessage(
            message(
                500,
                "An Error occurred during market settlement",
                { error: error.message }
            ),
            eventId
        );
    }
}