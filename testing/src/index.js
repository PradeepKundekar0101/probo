const express = require("express");
const app = express();

// Database objects
const inrBalances = {};
const markets = {};
const orderBook = {};
const stockBalances = {};

app.use(express.json());

// Reset endpoint (already implemented)
app.post("/reset", (req, res) => {
    Object.keys(orderBook).forEach(key => delete orderBook[key]);
    Object.keys(inrBalances).forEach(key => delete inrBalances[key]);
    Object.keys(stockBalances).forEach(key => delete stockBalances[key]);
    Object.keys(markets).forEach(key => delete markets[key]);
    res.status(200).json({ message: "Deleted" });
});

// User creation endpoint (already implemented)
app.post("/user/create/:userId", (req, res) => {
    const { userId } = req.params;
    inrBalances[userId] = {
        balance: 0,
        locked: 0
    };
    res.status(201).json({ message: `User ${userId} created` });
});

// Add INR balance (onramp)
app.post("/onramp/inr", (req, res) => {
    const { userId, amount } = req.body;
    inrBalances[userId].balance += amount;
    res.status(200).json({ message: `Onramped ${userId} with amount ${amount}` });
});

// Create new trading symbol
app.post("/symbol/create/:symbol", (req, res) => {
    const { symbol } = req.params;
    markets[symbol] = true;
    orderBook[symbol] = { yes: {}, no: {} };
    res.status(201).json({ message: `Symbol ${symbol} created` });
});

// Mint new tokens
app.post("/trade/mint", (req, res) => {
    const { userId, stockSymbol, quantity, price } = req.body;
    const totalCost = price * (quantity);

    if (inrBalances[userId].balance < totalCost ) {
        return res.status(400).json({ message: "Insufficient INR balance" });
    }

    // Deduct INR balance
    inrBalances[userId].balance -=  (totalCost);

    // Initialize stock balances if needed
    if (!stockBalances[userId]) {
        stockBalances[userId] = {};
    }
    if (!stockBalances[userId][stockSymbol]) {
        stockBalances[userId][stockSymbol] = {
            yes: { quantity: 0, locked: 0 },
            no: { quantity: 0, locked: 0 }
        };
    }


    stockBalances[userId][stockSymbol].yes.quantity += quantity;
    stockBalances[userId][stockSymbol].no.quantity += quantity;

    res.status(200).json({
        message: `Minted ${quantity} 'yes' and 'no' tokens for user ${userId}, remaining balance is ${inrBalances[userId].balance}`
    });
});

// Place sell order
app.post("/order/sell", (req, res) => {
    const { userId, stockSymbol, quantity, price, stockType } = req.body;
    
    // Check if user has enough tokens
    if (!stockBalances[userId]?.[stockSymbol]?.[stockType] ||
        stockBalances[userId][stockSymbol][stockType].quantity < quantity) {
        return res.status(400).json({ message: "Insufficient stock balance" });
    }

    // Lock the tokens
    stockBalances[userId][stockSymbol][stockType].quantity -= quantity;
    stockBalances[userId][stockSymbol][stockType].locked += quantity;
    if(!orderBook[stockSymbol]){
        orderBook[stockSymbol] = {yes:{},no:{}}
    }
    // Add to order book
    if (!orderBook[stockSymbol][stockType][price]) {
        orderBook[stockSymbol][stockType][price] = { total: 0, orders: {} };
    }
    orderBook[stockSymbol][stockType][price].orders[userId] = 
        (orderBook[stockSymbol][stockType][price].orders[userId] || 0) + quantity;
    orderBook[stockSymbol][stockType][price].total += quantity;

    res.status(200).json({
        message: `Sell order placed for ${quantity} '${stockType}' options at price ${price}.`
    });
});

// Place buy order
app.post("/order/buy", (req, res) => {
    const { userId, stockSymbol, quantity, price, stockType } = req.body;
    let remainingQuantity = quantity;
    const totalCost = quantity * price;
    let lastExecutedPrice = null;
    let hasMatches = false;

    if (inrBalances[userId].balance < totalCost) {
        return res.status(400).json({ message: "Insufficient INR balance" });
    }

    // Initialize buyer's stock balance
    if (!stockBalances[userId]) {
        stockBalances[userId] = {};
    }
    if (!stockBalances[userId][stockSymbol]) {
        stockBalances[userId][stockSymbol] = {
            yes: { quantity: 0, locked: 0 },
            no: { quantity: 0, locked: 0 }
        };
    }
    if(!orderBook[stockSymbol]) {
        orderBook[stockSymbol] = {yes:{}, no:{}};
    }
    
    // Add to order book
    if (!orderBook[stockSymbol][stockType][price]) {
        orderBook[stockSymbol][stockType][price] = { total: 0, orders: {} };
    }

    // Find matching sell orders
    const prices = Object.keys(orderBook[stockSymbol][stockType])
        .map(Number)
        .sort((a, b) => a - b)
        .filter(p => p <= price);

    for (const sellPrice of prices) {
        const orders = orderBook[stockSymbol][stockType][sellPrice].orders;
        for (const sellerId in orders) {
            const availableQuantity = orders[sellerId];
            const matchQuantity = Math.min(remainingQuantity, availableQuantity);

            if (matchQuantity > 0) {
                hasMatches = true;
                lastExecutedPrice = sellPrice;
                
                // Update balances
                const tradeCost = matchQuantity * sellPrice;
                inrBalances[userId].balance -= tradeCost;
                inrBalances[sellerId].balance += tradeCost;

                // Update stock balances
                stockBalances[userId][stockSymbol][stockType].quantity += matchQuantity;
                stockBalances[sellerId][stockSymbol][stockType].locked -= matchQuantity;

                // Update order book
                orders[sellerId] -= matchQuantity;
                orderBook[stockSymbol][stockType][sellPrice].total -= matchQuantity;
                if (orders[sellerId] === 0) {
                    delete orders[sellerId];
                }
                if (orderBook[stockSymbol][stockType][sellPrice].total === 0) {
                    delete orderBook[stockSymbol][stockType][sellPrice];
                }

                remainingQuantity -= matchQuantity;
            }

            if (remainingQuantity === 0) break;
        }
        if (remainingQuantity === 0) break;
    }

    // If there's remaining quantity, add it to the order book as a new buy order
    if (remainingQuantity > 0) {
        // Lock the remaining funds
        const remainingCost = remainingQuantity * price;
        inrBalances[userId].balance -= remainingCost;
        inrBalances[userId].locked += remainingCost;
        
        // Add to order book
        if (!orderBook[stockSymbol][stockType][price].orders[userId]) {
            orderBook[stockSymbol][stockType][price].orders[userId] = 0;
        }
        orderBook[stockSymbol][stockType][price].orders[userId] += remainingQuantity;
        orderBook[stockSymbol][stockType][price].total += remainingQuantity;
    }

    let message;
    if (!hasMatches) {
        message = "Buy order placed and pending";
    } else if (remainingQuantity === 0) {
        message = lastExecutedPrice === price ? 
            `Buy order placed and trade executed` : 
            `Buy order matched at best price ${lastExecutedPrice}`;
    } else {
        message = `Buy order matched partially at ${lastExecutedPrice}, ${remainingQuantity} remaining in order book`;
    }

    res.status(200).json({ 
        message,
        remainingQuantity,
        executedQuantity: quantity - remainingQuantity,
        lastExecutedPrice
    });
});

// Cancel order
app.post("/order/cancel", (req, res) => {
    const { userId, stockSymbol, quantity, price, stockType } = req.body;
    
    if (!orderBook[stockSymbol][stockType][price]?.orders[userId]) {
        return res.status(400).json({ message: "Order not found" });
    }

    // Return tokens to available balance
    stockBalances[userId][stockSymbol][stockType].locked -= quantity;
    stockBalances[userId][stockSymbol][stockType].quantity += quantity;

    // Remove from order book
    orderBook[stockSymbol][stockType][price].orders[userId] -= quantity;
    orderBook[stockSymbol][stockType][price].total -= quantity;

    if (orderBook[stockSymbol][stockType][price].orders[userId] === 0) {
        delete orderBook[stockSymbol][stockType][price].orders[userId];
    }
    if (orderBook[stockSymbol][stockType][price].total === 0) {
        delete orderBook[stockSymbol][stockType][price];
    }

    res.status(200).json({ message: "Sell order canceled" });
});

// Get INR balances
app.get("/balances/inr", (req, res) => {
    res.status(200).json(inrBalances);
});

// Get stock balances
app.get("/balances/stock", (req, res) => {
    res.status(200).json(stockBalances);
});

// Get order book
app.get("/orderbook", (req, res) => {
    res.status(200).json(orderBook);
});
app.listen(8005,()=>{
    console.log("Test server running at port"+8005)
})
module.exports = app;