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

        //console.log(ECoin.ETH);


        /*
        const uri = 'https://api-pub.bitfinex.com/v2/conf/pub:list:pair:exchange';
        try {
            let axiosInstance = axios.create();
            axiosInstance.interceptors.response.use(null, error => {
                return Promise.reject(error);
            });

            const res = await axiosInstance.get(uri);
            console.log('OK!');

        } catch (e) {
            console.log('Err!');
        }
        */

        //const ethPairs = await BitfinexApi.getPairsByCoin(ECoin.ETH);
        PoloniexApi.loadMarkets();
        BitfinexApi.loadMarkets();
        //console.log(ethPairs);

        /*
        const pairs: Array<ITradingPair> = [
            [ECoin.ETH, ECoin.USDT],
            [ECoin.BTC, ECoin.USDC],
            [ECoin.XRP, ECoin.BTC],
            [ECoin.ETH, ECoin.BTC],
            [ECoin.DOGE, ECoin.BTC]
        ];
        BitfinexApi.watchTrades(pairs);
        */
    }

} catch(e) {
    //console.log(e);
}
