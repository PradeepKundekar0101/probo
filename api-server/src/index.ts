import express from "express"
import Redis from "ioredis"
import { balanceRouter } from "./routes/balance";
import { userRouter } from "./routes/user";
import { onrampRouter } from "./routes/onramp";
import { orderBookRouter } from "./routes/orderBook";
import { orderRouter } from "./routes/order";
import {marketRouter} from "./routes/market"

export const redis = new Redis({
    port:6379,
    host:"localhost"
})

const app = express();
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

export default app;