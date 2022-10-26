import ws from "ws";

import axios from "axios";
import {ITradingPair, ITrade, ECoin, IMarket} from "../../Interfaces.js";
import {Exchange, ETickerConvert} from '../Exchange.js';

import TradeService from "../../../services/trade.service.js";
import {CoinService} from "../../../services/coin.service.js";
import MarketService from "../../../services/market.service.js";
import ExchangeService from "../../../services/exchange.service.js";

import asyncForeach from '../../../utils/asyncForeach.js';



class BitfinexApi extends Exchange {

    static exTicker:string = 'BITFINEX';

    // Ticker conversation below app and exchange formats
    // For what? Some times exchange invent unique ticker names, ex. UST instead of USDT
    // Converting format: exchange format => to Coin.TICKER (app format)
    static convertRules:Array<[string, ECoin]> = [
        ['UST', ECoin.USDT],
        ['USD', ECoin.USDC]
    ];

    // testing keys
    private static key:string = '';
    private static secretKey:string = '';

    // --------------------
    // public API
    static URI_PUBLIC:string = 'https://api-pub.bitfinex.com/v2/';

    // high level overview of the state of the market. Ex. ?symbols=tBTCUSD
    GET_TICKERS:string = 'tickers';

    // --------------------
    // Web socket endpoint
    static URI_WS:string = 'wss://api-pub.bitfinex.com/ws/2';

    // --------------------
    // Authenticated API
    URI_AUTH:string = 'https://api.bitfinex.com/v2/';

    // --------------------
    // configs
    static URI_CONF_LIST_PAIRS:string = 'conf/pub:list:pair:exchange';

    static async loadMarkets(): Promise<Array<ITradingPair>> {
        return new Promise<Array<ITradingPair>>(async (resolve, reject) => {
            const endpoint: string = this.URI_PUBLIC + this.URI_CONF_LIST_PAIRS;
            try {

                let axiosInstance = axios.create();
                axiosInstance.interceptors.response.use(null, error => {
                    console.log('Error loading ' + error.config.url + ' error code: ' + error.response.data.code);
                    return Promise.reject(error);
                });

                const response = await axiosInstance.get(endpoint);

                let pairs:Array<ITradingPair> = [];

                const rawPairs = response.data[0];
                // parse pairs
                rawPairs.map(market => {
                    let sepPos = market.indexOf(':');
                    let rawPair:ITradingPair = [undefined, undefined];

                    if(sepPos !== -1) {
                        // we have separator in pair string
                        rawPair[0] = market.slice(0, sepPos);
                        rawPair[1] = market.slice(sepPos + 1);
                    } else {
                        // we have standard names in pair, 3 letters for each
                        rawPair[0] = market.slice(0, 3);
                        rawPair[1] = market.slice(3);
                    }
                    const pair = this.toAppFormat(rawPair, this.convertRules);
                    if(this.existsTickers(pair)) {
                        pairs.push(pair);
                    }
                })

                await this.cachePairs(pairs, this.exTicker);

                resolve(pairs);

            } catch (err) {
                reject(err);
            }
        })
    }


    static getPairs (forceUpdate = false): Promise<Array<ITradingPair>> {
        return new Promise(async (resolve, reject) => {
            try {
                if(!this.pairs.length || forceUpdate === true) {
                    // get and save trading pairs
                    this.pairs = await this.loadMarkets();
                }
                resolve(this.pairs);
            } catch (err) {
                reject(err);
            }
        });
    }


    static getPairsByCoin(coinTicker: ECoin): Promise<Array<ITradingPair>> {
        return new Promise(async (resolve, reject) => {
            try {
                const pairs = await this.getPairs();
                const filteredPairs = Object.values(pairs).filter(pair => pair.includes(coinTicker));
                resolve(filteredPairs);
            } catch (err) {
                reject(err);
            }
        })
    }


    static async subscribeToTrades (market:IMarket, onMessageHandler) {
        // convert pair to exchange format
        const exPair = this.toExchangeFormat(market.tradingPair, this.convertRules);
        const msg = JSON.stringify({
            event: 'subscribe',
            channel: 'trades',
            symbol: 't'+(exPair.join('')).toUpperCase()
        });

        // subscribe
        const socket = new ws(this.URI_WS)

        // subscribe to pair
        socket.on('open', () => socket.send(msg))

        socket.on('message', msg => {
            let data = JSON.parse(msg);
            // format:
            const channelId = parseInt(data[0]);
            const type = data[1];
            // processing only TE type message
            if(type === 'te') {
                const raw = data[2];
                if(undefined !== raw) {
                    const trades:Array<ITrade> = [];
                    let trade: ITrade = {
                        marketId: market.marketId,
                        exId: market.exId,
                        exTicker: market.exTicker,
                        pair: market.tradingPair,
                        exTradeId: raw[0],
                        mts: raw[1],
                        amount: raw[2],
                        rate: raw[3]
                    }
                    onMessageHandler(trade);
                }

            }
        })
    }


    static watchTrades(tradingPairs: Array<ITradingPair>) {

        asyncForeach(tradingPairs, async (pair) => {
            return new Promise(async (resolve, reject) => {
                try {
                    // check exists in exchange
                    const isExists = await this.existsOnExchange(pair);

                    if (false === isExists) {
                        console.log(pair, ' - pair is not exists on ', this.exTicker);
                    } else {

                        const coinsId = await CoinService.createCoinsFromPair(pair);

                        const exchangeId = await ExchangeService.findExchangeByTicker(this.exTicker);
                        if(false === exchangeId) {
                            throw new Error('Can\'t find exchnage by ticker ' + this.exTicker);
                        }

                        // fint market in DB
                        let marketId = await MarketService.findMarket(coinsId, exchangeId);

                        const market: IMarket = {
                            exId: exchangeId,
                            exTicker: this.exTicker,
                            baseCoinId: coinsId[0],
                            quoteCoinId: coinsId[1],
                            tradingPair: pair
                        };

                        if(marketId === false) {
                            // market not found, create new
                            marketId = await MarketService.createMarket(market);
                        }

                        if(typeof marketId === "number") {
                            market.marketId = marketId;
                        }

                        console.log(pair, ' - subscribe to pair, marketID: ', marketId);
                        await this.subscribeToTrades(market, async (trade: ITrade) => {
                            await TradeService.saveTrade(trade);
                        })
                        resolve();
                    }

                } catch(e) {
                    console.log('Error ');
                    //reject(e);
                }
            })
        });

    }


    static findPairId(pair:ITradingPair): number|boolean {

        return false;
    }

    static async existsOnExchange(targetPair: ITradingPair): Promise<boolean> {
        let pairs = await this.getPairs();
        for(const [key, pair] of Object.entries(pairs)) {
            if (pair[0] === targetPair[0] && pair[1] === targetPair[1]) {
                return true;
            }
        }
        return false;
    }


}

export default BitfinexApi;
