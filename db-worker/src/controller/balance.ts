import {prismaClient} from "../services/prisma"
export const updateInrBalance =async (data:any)=>{
    const {userId,locked,balance}:{
        userId:string,locked:number,balance:number
    } = data
    console.log("Updatiing Inr balance of"+userId)
    console.log(locked+" "+balance)
    await prismaClient.inrBalance.update({
            where:{
                userId
            },
            data:{
                locked,
                balance
            },  
        })
   
}
interface UpdateStockBalanceData {
    userId: string;
    noLocked: number;
    yesLocked: number;
    stockSymbol: string;
    yesQuantity: number;
    noQuantity: number;
}


export const updateStockBalance = async (data: UpdateStockBalanceData) => {
    const {
        userId,
        noLocked,
        yesLocked,
        stockSymbol,
        yesQuantity,
        noQuantity,
    } = data;

    try {

        const existingStockBalance = await prismaClient.stockBalance.findFirst({
            where: {
                userId,
                marketId: stockSymbol
            }
        });
        console.log("Existing sb")
        console.log(existingStockBalance)
        if (!existingStockBalance) {
            return await prismaClient.stockBalance.create({
                data: {
                    userId,
                    marketId:stockSymbol,
                    yesLocked: yesLocked,
                    yesQuantity: yesQuantity,
                    noLocked: noLocked,
                    noQuantity: noQuantity
                }
            });
        }

        return await prismaClient.stockBalance.update({
            where: {
                id: existingStockBalance.id 
            },
            data: {
                yesQuantity,
                noQuantity,
                noLocked,
                yesLocked,
            },
        });
    } catch (error) {
        console.error('Error updating stock balance:', error);
        throw new Error(`Failed to update stock balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
