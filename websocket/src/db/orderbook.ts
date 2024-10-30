export interface Orderbook{
    [stockSymbol:string]:{
        yes:{
            [price:number]:number
        },
        no:{
            [price:number]:number
        }
    }
}
export const orderBook :Orderbook = {}