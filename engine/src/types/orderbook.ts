export interface OrderBook{
    yes:{
        [price:number]:{
            total:number,
            orders:{
                [key:string]:{
                    type:"sell" | "reversed",
                    quantity: number
                }
            }
        }
    },
    no:{
        [price:number]:{
            total:number,
            orders:{
                [key:string]:{
                    type:"sell" | "reversed",
                    quantity: number
                }
            }
        }
    }
}