import { prismaClient } from "../services/prisma";
export const handleUpdateTradersCount = async (data:{id:string,count:number})=>{
    try {
        const {id,count} = data;
        await prismaClient.market.update({
            where:{id}, data:{
                numberOfTraders:count
            }
        })
    } catch (error) {
        console.log(error)
    }
}