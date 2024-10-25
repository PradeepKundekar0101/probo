import {prismaClient} from "../services/prisma"
export const updateInrBalance =async (data:any)=>{
    const {userId,locked,balance}:{
        userId:string,locked:number,balance:number
    } = data

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

export const updateStockBalance = async (data: any) => {
    const {
        userId,
        noLocked,
        yesLocked,
        stockSymbol,
        yesQuantity,
        noQuantity,
    }: {
        userId: string;
        noLocked: number;
        yesLocked: number;
        stockSymbol: string;
        yesQuantity: number;
        noQuantity: number;
    } = data;

        await prismaClient.stockBalance.update({
            where: {
                userId,
                stockSymbol:{
                    stockSymbol
                }
            },
            data: {
                yesQuantity,
                noQuantity,
                noLocked,
                yesLocked,
            },
        });
    
};
