
import express from "express";
import { balanceRouter } from "./routes/balance";
import { userRouter } from "./routes/user";
import { onrampRouter } from "./routes/onramp";
import { orderBookRouter } from "./routes/orderBook";
import { orderRouter } from "./routes/order";
import { resetDB } from "./utils/resetDB";
import {marketRouter} from "./routes/market"
import {inrBalances, stockBalances} from "./db/index"

const app = express();

app.use(express.json());
app.post("/reset",(req,res)=>{
    resetDB()
    res.status(200)
});
app.get('/', (req, res) => {
    res.send("Options Trading App");
});
app.use('/user', userRouter);
app.use('/balance', balanceRouter);
app.use('/onramp', onrampRouter);
app.use('/orderbook', orderBookRouter);
app.use('/order', orderRouter);
app.use('/market', marketRouter);

inrBalances["pradeep"] = {
    locked:0,
    balance:100000
}
inrBalances["sahil"] = {
    locked:0,
    balance:100000
}


export default app;