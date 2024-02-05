import { Exchange } from '../Exchange.js';
import axios from 'axios';
import { ITradingPair, ECoin, IMarketsCache, IMarket, ITrade } from '../../Interfaces.js';

import TradeService from "../../../services/trade.service.js";
import { CoinService } from "../../../services/coin.service.js";

import MarketService from "../../../services/market.service.js";
import asyncForeach from '../../../utils/asyncForeach.js';
import ExchangeService from "../../../services/exchange.service.js";

class PoloniexApi extends Exchange {

    exTicker:string = 'POLONIEX';

    private pingIntervalId = null;

    // Ticker conversation below app and exchange formats
    // For what? Some times exchange invent unique ticker names, ex. UST instead of USDT
    // Converting format: exchange format => to Coin.TICKER (app format)
    convertRules:Array<[string, ECoin]> = [
        //['USDT', ECoin.USDTEST],
    ];

    URI_PUBLIC_API = 'https://api.poloniex.com/';

    URI_CURRENCIES = 'currencies?includeMultiChainCurrencies=true';

    URI_MARKETS = 'markets';

    // --------------------
    // Web socket private API endpoint
    URI_PRIVATE_WS = 'wss://ws.poloniex.com/ws/private';

    // --------------------
    // Web socket public API endpoint
    URI_PUBLIC_WS = 'wss://ws.poloniex.com/ws/public';


    async loadMarkets (): Promise<IMarketsCache> {
        return new Promise<IMarketsCache>(async (resolve, reject) => {
            const endpoint: string = this.URI_PUBLIC_API + this.URI_MARKETS;
            try {
                const response = await axios.get(endpoint);
                let pairs:Array<ITradingPair> = [];
                let unknownPairs:Array<ITradingPair> = [];

                let rawMarkets = response.data;

                rawMarkets.forEach(rawMarket => {
                    let sepPos = rawMarket.symbol.indexOf('_');
                    let rawPair: ITradingPair = [undefined, undefined];

                    rawPair[0] = rawMarket.symbol.substr(0,sepPos);
                    rawPair[1] = rawMarket.symbol.substr(sepPos + 1);

                    const pair = this.toAppFormat(rawPair, this.convertRules);
                    // check correct tickers
                    if(this.existsTickers(pair)) {
                        // correct, tickers is exists
                        pairs.push(pair);
                    } else {
                        // save unknown pairs
                        unknownPairs.push(pair);
                    }
                })

                await this.cachePairs(pairs, unknownPairs, this.exTicker);

                const result: IMarketsCache = {exists: pairs, unknown: unknownPairs};
                resolve(result);
            } catch (e) {
                reject(e);
            }
        })
    }


    handleOpenSocket () {
        console.log('Socket with ', this.exTicker ,' was opened');

        // The Poloniex WebSockets server expects a message or a ping every 30 sec. or it will end
        // we will send ping every 20 sec.
        const pingInterval = 20;
        this.pingIntervalId = setInterval(async () => {
                const pingMessage = JSON.stringify({ event: 'ping' });
                const ws = this.getSocket();
                await ws.send(pingMessage);
                console.log('->', pingMessage);
            },
            pingInterval * 1000
        ); // every 20 sec.

    }


    handleCloseSocket () {
        clearInterval(this.pingIntervalId);
    }


    getSocket () {
        return super.initSocket(this.URI_PUBLIC_WS);
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

                        await this.subscribeToMarketTrades(market);

                        resolve();
                    }
                } catch (e) {
                    console.log(e);
                }
            })
        })
    }


    subscribeMessage (market:IMarket):string {
        // convert pair to exchange format
        const exPair = this.toExchangeFormat(market.tradingPair, this.convertRules);

        const subscribeMessage = JSON.stringify({
            event: 'subscribe',
            channel: ['trades'],
            symbols: [(exPair.join('_')).toUpperCase()]
        });

        return subscribeMessage;
    }


    async parseMessage (d) {
        //console.log('<- ', d);
        if(false !== d.hasOwnProperty('event')) {
            switch(d.event) {
                case 'pong':
                    this.responsePong(d);
                    break;
                case 'subscribe':
                    this.responseSubscribe(d);
                    break;
            }
        }
        if(d.hasOwnProperty('channel') && d.channel === 'trades') {
            // trade message processing
            if(d.hasOwnProperty('data') && Array.isArray(d.data)) {
                const rawTrades = d.data;
                rawTrades.forEach(raw => {
                    let { symbol } = raw;
                    const tickers = symbol.split('_').join('/');
                    const sub = this.subs.marketTrades.find(sub => sub.market.marketTicker === tickers);
                    this.processingTrade(sub, raw);
                });
            }
        }
    }


    private processingTrade (sub, raw) {
        const amount = (raw.takerSide === 'sell') ? (-1) * raw.quantity : 1 * raw.quantity;
        let trade: ITrade = {
            marketId: sub.market.marketId,
            exId: sub.market.exId,
            exTicker: sub.market.exTicker,
            pair: sub.market.tradingPair,
            marketTicker: sub.market.marketTicker,
            exTradeId: raw.id,
            mts: raw.ts,
            amount: amount,
            rate: +(raw.price) // convert to number
        }
        TradeService.saveTrade(trade);
    }


    async responseSubscribe (data) {
        if(data.hasOwnProperty('channel') && data.channel === 'trades' && data.hasOwnProperty('symbols')) {
            const symbols = data.symbols;
            symbols.forEach(pair => {
                const subs = this.subs.marketTrades.filter(sub => {
                    const exPair = this.toExchangeFormat(sub.market.tradingPair, this.convertRules);
                    const s = (exPair.join('_')).toUpperCase();
                    if(s === pair) return sub;
                });
                subs.forEach(async sub => await MarketService.markMarketAsWatched(sub.market.marketId));
            });
        }
    }


    async responsePong (data) {
    }

}

export default PoloniexApi;
