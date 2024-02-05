import axios from "axios";
import { ITradingPair, ITrade, ECoin, IMarket, IMarketsCache } from "../../Interfaces.js";
import { Exchange, ETickerConvert } from '../Exchange.js';

import TradeService from "../../../services/trade.service.js";
import { CoinService } from "../../../services/coin.service.js";
import MarketService from "../../../services/market.service.js";
import ExchangeService from "../../../services/exchange.service.js";

import asyncForeach from '../../../utils/asyncForeach.js';

class BitfinexApi extends Exchange {

    exTicker:string = 'BITFINEX';

    // Ticker conversation below app and exchange formats
    // For what? Some times exchange invent unique ticker names, ex. UST instead of USDT
    // Converting format: exchange format => to Coin.TICKER (app format)
    convertRules:Array<[string, ECoin]> = [
        ['UST', ECoin.USDT],
        ['USD', ECoin.USDC]
    ];

    // testing keys
    private key:string = '';
    private secretKey:string = '';

    private messageHandler = null;

    private EVENTS = {
        subscribed: 'subscribed'
    };

    // --------------------
    // public API
    URI_PUBLIC:string = 'https://api-pub.bitfinex.com/v2/';

    // high level overview of the state of the market. Ex. ?symbols=tBTCUSD
    GET_TICKERS:string = 'tickers';

    // --------------------
    // Web socket endpoint
    URI_WS:string = 'wss://api-pub.bitfinex.com/ws/2';

    // --------------------
    // Authenticated API
    URI_AUTH:string = 'https://api.bitfinex.com/v2/';

    // --------------------
    // configs
    URI_CONF_LIST_PAIRS:string = 'conf/pub:list:pair:exchange';

    async loadMarkets (): Promise<IMarketsCache> {
        return new Promise<IMarketsCache>(async (resolve, reject) => {
            try {

                const endpoint: string = this.URI_PUBLIC + this.URI_CONF_LIST_PAIRS;
                let axiosInstance = axios.create();
                axiosInstance.interceptors.response.use(null, error => {
                    console.log('Error loading ' + error.config.url + ' error code: ' + error.response.data.code);
                    return Promise.reject(error);
                });

                const response = await axiosInstance.get(endpoint);

                let pairs:Array<ITradingPair> = [];
                let unknownPairs:Array<ITradingPair> = [];

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
                    } else {
                        // save unknown pairs
                        unknownPairs.push(pair);
                    }
                })

                await this.cachePairs(pairs, unknownPairs, this.exTicker);

                const result: IMarketsCache = {exists: pairs, unknown: unknownPairs};
                resolve(result);
            } catch (err) {
                reject(err);
            }
        })
    }


    async parseMessage (d) {

        //console.log('<- ', d);

        if(d.hasOwnProperty('event') && d.hasOwnProperty('channel')) {

            if(d.event === this.EVENTS.subscribed && d.channel === 'trades') {
                // successful subscription
                //console.log('Successful subscription...');
                if(d.hasOwnProperty('chanId') && d.hasOwnProperty('symbol')) {
                    const {chanId, symbol} = d;
                    // console.log('ChannelId:', chanId, 'Symbol:', symbol);
                    const sub = this.subs.marketTrades.find(sub => {
                        const exPair = this.toExchangeFormat(sub.market.tradingPair, this.convertRules);
                        const s = 't'+(exPair.join('')).toUpperCase();
                        if(s === symbol) return sub;
                    });
                    if(sub !== undefined) {
                        sub.channelId = chanId;
                        // mark pair as watched
                        await MarketService.markMarketAsWatched(sub.market.marketId);
                    }
                }
            }
        } else {

            // format:
            const channelId = parseInt(d[0]);
            const second = d[1];
            const sub = this.subs.marketTrades.find(sub => sub.channelId === channelId);

            // check group of update message
            if(typeof second === 'object' && Array.isArray(second)) {
                // this is group, parse rows
                second.forEach(row => this.processingTrade(sub, row))
            } else {
                // Variants: hb - heartbeat, te/tu, fte/ftu
                // "tu" message contains the real trade ID
                if(second === 'tu') {
                    // processing only TE type message
                    const raw = d[2];
                    if(undefined !== raw) {
                        this.processingTrade(sub, raw);
                    }
                }
            }

        }

    }


    private processingTrade (sub, raw) {
        let trade: ITrade = {
            marketId: sub.market.marketId,
            exId: sub.market.exId,
            exTicker: sub.market.exTicker,
            pair: sub.market.tradingPair,
            marketTicker: sub.market.marketTicker,
            exTradeId: raw[0],
            mts: raw[1],
            amount: raw[2],
            rate: raw[3]
        }
        TradeService.saveTrade(trade);
    }


    subscribeMessage (market:IMarket):string {
        // convert pair to exchange format
        const exPair = this.toExchangeFormat(market.tradingPair, this.convertRules);

        const subscribeMessage = JSON.stringify({
            event: 'subscribe',
            channel: 'trades',
            symbol: 't'+(exPair.join('')).toUpperCase()
        });

        return subscribeMessage;
    }


    async watchTrades (tradingPairs: Array<ITradingPair>) {

        asyncForeach(tradingPairs, async (pair) => {
            return new Promise(async (resolve, reject) => {
                try {
                    // check exists in exchange
                    const isExists = await this.existsOnExchange(pair);

                    if (false === isExists) {
                        console.log(pair, ' - pair is not exists on ', this.exTicker);
                    } else {

                        const coinsIds = await CoinService.createCoinsFromPair(pair);

                        const exchangeId = await ExchangeService.findExchangeByTicker(this.exTicker);
                        if(false === exchangeId) {
                            throw new Error('Can\'t find exchnage by ticker ' + this.exTicker);
                        }

                        // fint market in DB
                        let marketId = await MarketService.findMarket(coinsIds, exchangeId);

                        const market: IMarket = {
                            exId: exchangeId,
                            exTicker: this.exTicker,
                            marketTicker: MarketService.tickerByPair(pair),
                            baseCoinId: coinsIds[0],
                            quoteCoinId: coinsIds[1],
                            tradingPair: pair
                        };

                        if(marketId === false) {
                            // market not found, create new
                            console.log('create a new market');
                            marketId = await MarketService.createMarket(market);
                        }

                        if(typeof marketId === "number") {
                            market.marketId = marketId;
                        }

                        console.log(pair, ' - subscribe to pair, marketID: ', marketId);

                        await this.subscribeToMarketTrades(market)
                        resolve();
                    }

                } catch(e) {
                    console.log('Error subscribe to trades for ', this.exTicker, e);
                    //reject(e);
                }
            })
        });

    }


    handleOpenSocket () {
        console.log('Socket with ', this.exTicker, ' was opened');
    }


    handleCloseSocket () {

    }


    getSocket () {
        return super.initSocket(this.URI_WS);
    }


    findPairId (pair:ITradingPair): number|boolean {

        return false;
    }


}

export default BitfinexApi;
