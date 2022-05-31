import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ExchangeRouter } from './routers/exchange.router.js';
import { TradingPairRouter } from "./routers/tradingPair.router.js";
import { TradeRouter } from "./routers/trade.router.js";
import { AuthRouter } from "./routers/auth.router.js";
import BitfinexApi from "./classes/exchange/bitfinex/BitfinexApi.js";
import { ECoin } from "./classes/Interfaces.js";
import { AppMode, env } from "./utils/appEnvironment.js";
console.log(env);
if ([AppMode.julius, AppMode.api].includes(env.mode)) {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(cors());
    app.use('/api', [ExchangeRouter, TradingPairRouter, TradeRouter, AuthRouter]);
    app.listen(env.port, () => console.log('Server started on port ' + env.port));
}
if ([AppMode.julius, AppMode.watcher].includes(env.mode)) {
    const ethPairs = await BitfinexApi.getPairsByCoin(ECoin.ETH);
    console.log(ethPairs);
    const pairs = [
        [ECoin.ETH, ECoin.USDT],
        [ECoin.BTC, ECoin.USDC],
        [ECoin.XRP, ECoin.BTC],
        [ECoin.ETH, ECoin.BTC],
        [ECoin.DOGE, ECoin.BTC]
    ];
    BitfinexApi.watchTrades(pairs);
}
//# sourceMappingURL=index.js.map