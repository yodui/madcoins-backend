import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import axios from 'axios';

import errorMiddleware from './middlewares/error-middleware.js';

import {ExchangeRouter} from './routers/exchange.router.js';
import {TradingPairRouter} from "./routers/tradingPair.router.js";
import {TradeRouter} from "./routers/trade.router.js";
import {AuthRouter} from "./routers/auth.router.js";

import BitfinexApi from "./classes/exchange/bitfinex/BitfinexApi.js";
import PoloniexApi from "./classes/exchange/poloniex/PoloniexApi.js";

import {ECoin, ITradingPair} from "./classes/Interfaces.js";
import {AppMode, env} from "./utils/Environment.js";

// echanges from /config/default.json and other parameters
console.log('ENV: ', env);

try {

    if([AppMode.julius, AppMode.api].includes(env.mode)) {
        const app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use(cors());
        app.use('/api', [ExchangeRouter, TradingPairRouter, TradeRouter, AuthRouter]);
        app.use(errorMiddleware);

        app.listen(env.port, () => console.log('Server started on port ' + env.port));
    }

    if([AppMode.julius, AppMode.watcher].includes(env.mode)) {

        PoloniexApi.loadMarkets();
        BitfinexApi.loadMarkets();

        const pairs: Array<ITradingPair> = [
            [ECoin.ETH, ECoin.USDT],
            [ECoin.BTC, ECoin.USDC],
            [ECoin.XRP, ECoin.BTC],
            [ECoin.ETH, ECoin.BTC],
            [ECoin.DOGE, ECoin.BTC],
            [ECoin.EOS, ECoin.BTC],
            [ECoin.SOL, ECoin.BTC],
            [ECoin.LUNA, ECoin.USDT],
            [ECoin.SOL, ECoin.BTC]
        ];
        BitfinexApi.watchTrades(pairs);

    }


} catch(e) {
    console.log(e);
}
