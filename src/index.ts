import express from 'express';
import {ExchangeRouter} from './routers/exchange.router.js';
import {TradingPairRouter} from "./routers/tradingPair.router.js";
import {TradeRouter} from "./routers/trade.router.js";

import BitfinexApi from "./classes/exchange/bitfinex/BitfinexApi.js";

import {Coin, ITradingPair} from "./classes/Interfaces.js";
import {AppMode, clParams} from "./utils/commandLineArgs.js";

console.log(clParams);

const PORT = clParams.port;

if([AppMode.julius, AppMode.restapi].includes(clParams.mode)) {
    const app = express();
    app.use(express.json());
    app.use('/api', [ExchangeRouter, TradingPairRouter, TradeRouter]);
    app.listen(PORT, () => console.log('Server started on port ' + PORT));
}

if([AppMode.julius, AppMode.watcher].includes(clParams.mode)) {
    const ethPairs = await BitfinexApi.getPairsByCoin(Coin.ETH);
    console.log(ethPairs);

    const pairs: Array<ITradingPair> = [
        [Coin.ETH, Coin.USDT],
        [Coin.BTC, Coin.USDC],
        [Coin.XRP, Coin.BTC],
        [Coin.ETH, Coin.BTC],
        [Coin.DOGE, Coin.BTC]
    ];

    BitfinexApi.watchTrades(pairs);
}


