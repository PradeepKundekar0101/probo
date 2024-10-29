import { GlobalData, orderBook } from "../db"
import { Market } from "../types/market"
import { message, publishMessage } from "../services/redis"
import { produceMessage } from "../services/kafka"
export const createMarket = async (data:Market,eventId:string)=>{
    const {startTime,stockSymbol,endTime,title,description,sourceOfTruth} = data
    try
    {
        if(GlobalData.markets[stockSymbol]) 
            return publishMessage(message(409,`${stockSymbol} already taken `,null),eventId)
        GlobalData.markets[stockSymbol]={ startTime,stockSymbol,description,endTime,title,sourceOfTruth,tradersCnt:0,isOpen:true,result:null}
        GlobalData.orderBook[stockSymbol]={
            yes:{},
            no:{}
        }
        
        publishMessage(message(201,"Succesfully created market"+stockSymbol,GlobalData.markets[stockSymbol]),eventId)
    }
    catch (error:any)
    {
        publishMessage(message(500,"An Error occured",{error:error.message}),eventId)
    }
}
interface SettleData  {stockSymbol:string,result:"yes"|"no"}
export const settleMarket = async (data: SettleData, eventId: string) => {
    const { stockSymbol, result } = data
    try {
        if (!GlobalData.markets[stockSymbol]) {
            return publishMessage(message(403, "Stock symbol not found", null), eventId)
        }
        if (GlobalData.markets[stockSymbol].result) {
            return publishMessage(message(400, "Market is already settled", null), eventId)
        }
        GlobalData.markets[stockSymbol].isOpen = false
        GlobalData.markets[stockSymbol].result = result

        for (const [userId, userStocks] of Object.entries(GlobalData.stockBalances)) {
            if (userStocks[stockSymbol]) {
                const stockPosition = userStocks[stockSymbol]
                if (!GlobalData.inrBalances[userId]) {
                    GlobalData.inrBalances[userId] = {
                        balance: 0,
                        locked: 0
                    }
                }
                if (result === "yes") {
                    const winnings = stockPosition.yes.quantity * 10
                    GlobalData.inrBalances[userId].balance += winnings   
                } else if (result === "no") {
                    const winnings = stockPosition.no.quantity * 10
                    GlobalData.inrBalances[userId].balance += winnings
                }

                delete GlobalData.stockBalances[userId][stockSymbol]
            }
        }

        delete GlobalData.orderBook[stockSymbol]

        publishMessage(
            message(
                200,
                `Successfully settled market ${stockSymbol} with result ${result}`,
                GlobalData.markets[stockSymbol]
            ),
            eventId
        )
    } catch (error: any) {
        publishMessage(
            message(
                500,
                "An Error occurred during market settlement",
                { error: error.message }
            ),
            eventId
        )
}}