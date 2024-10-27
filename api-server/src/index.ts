import express from "express"
import { balanceRouter } from "./routes/balance";
import { userRouter } from "./routes/user";
import { onrampRouter } from "./routes/onramp";
import { orderBookRouter } from "./routes/orderBook";
import { orderRouter } from "./routes/order";
import {marketRouter} from "./routes/market"
import dotenv from "dotenv"
import cors from "cors"
dotenv.config()
const app = express();
app.use(cors({
    origin:"*"
}))
app.use(express.json());
app.get('/', (req, res) => {
    res.send("Options Trading App");
});
app.use('/user', userRouter);
app.use('/balance', balanceRouter);
app.use('/onramp', onrampRouter);
app.use('/orderbook', orderBookRouter);
app.use('/order', orderRouter);
app.use('/market', marketRouter);
app.listen(8000,()=>{
    console.log("API server running at port 8000")
})

export default app;