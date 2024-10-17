
import express from "express";
import { balanceRouter } from "./routes/balance";
import { userRouter } from "./routes/user";
import { onrampRouter } from "./routes/onramp";
import { symbolRouter } from "./routes/symbol";
import { orderBookRouter } from "./routes/orderBook";
import { orderRouter } from "./routes/order";
import { resetDB } from "./utils/resetDB";

const app = express();

app.use(express.json());
app.post("/reset",(req,res)=>{
    resetDB()
    res.status(200)
})
app.get('/', (req, res) => {
    res.send("Options Trading App");
});
app.use('/user', userRouter);
app.use('/balance', balanceRouter);
app.use('/onramp', onrampRouter);
app.use('/symbol', symbolRouter);
app.use('/orderbook', orderBookRouter);

app.use('/order', orderRouter);

export default app;