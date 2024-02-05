import ws from "ws";
import {ECoin, ITradingPair, IMarketsCache, IMarket} from "../Interfaces.js";
import * as fs from "fs";
import path from 'path';
import MarketService from "../../services/market.service.js";

import getCacheDir from '../../utils/CacheDir.js';

enum ETickerConvert {
    PROJECT_VIEW,
    EXCHANGE_VIEW
}

interface ISubscriptions {
    marketTrades: Array<IMarketSub>
}

interface IMarketSub {
    market: IMarket,
    channelId?: Number
}

class Exchange {

    // Exchange socket
    protected ws = null;

    protected exTicker = null;

    // Subscribes
    protected subs:ISubscriptions = {
        marketTrades: [] // subscriptions to market trades
    };

    // path to cache
    PAIRS_CACHE:string = 'pairs.json';

    marketsCache:IMarketsCache = {exists:null, unknown:null};

    // Convert tickers to app format, ex. UST => USDT
    toAppFormat (pair: ITradingPair, rules: Array<[string, ECoin]>) {
        for(let r in rules) {
            // convert tickers of pair ot application format
            if(pair[0] === rules[r][0]) pair[0] = rules[r][1];
            if(pair[1] === rules[r][0]) pair[1] = rules[r][1];
        }
        return pair;
    }


    getSubs () {

    }


    protected getSocket () {
        return this.initSocket(this.getSocketUri());
    }


    initSocket (uri:string) {
        if(this.ws === null) {
            // create socket
            this.ws = new ws(uri);

            const subs = this.getSubs();

            this.ws.on('open', async () => {
                this.handleOpenSocket();
                // let's send all subscribe messages to market trades
                this.subs.marketTrades.map(sub => {
                    console.log('Subscribe to market: ', sub.market.marketId);
                    this.subscribeToMarket(sub.market);
                });
            });

            this.ws.on('message', async msg => {
                let data = JSON.parse(msg);
                await this.parseMessage(data);
            });

            this.ws.on('close', async event => {
                console.log('Close ', this.exTicker, ' connection event');
                this.handleCloseSocket();
                this.closeConnection();
            });

            this.ws.on('error', async event => {
                console.log('Error ', this.exTicker, ' connection.', event.data);
                this.closeConnection();
            });
        }
        return this.ws;
    }


    async getPairs (forceUpdate:boolean = false, unknown:boolean = false): Promise<Array<ITradingPair>> {
        return new Promise(async (resolve, reject) => {
            try {
                if(forceUpdate === true || this.marketsCache.exists === null || this.marketsCache.unknown === null) {
                    this.marketsCache = await this.loadMarkets();
                }
                let result;
                if(unknown === true) {
                    result = this.marketsCache.unknown;
                } else {
                    result = this.marketsCache.exists;
                }
                resolve(result);
            } catch(e) {
                reject(e);
            }
        })
    }


    async getUnknownPairs (forceUpdate:boolean = false): Promise<Array<ITradingPair>> {
        return this.getPairs(forceUpdate, true)
    }


    getPairsByCoin (coinTicker: ECoin): Promise<Array<ITradingPair>> {
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


    async closeConnection () {
        const ids = this.subs.marketTrades.map(sub => sub.market.marketId);
        console.log('Close subs:', ids);
        await MarketService.markMarketsListAsUnwatched(ids);
    }


    // Convert tickers to exchange format, ex. USDT => UST
    toExchangeFormat (pair: ITradingPair, rules: Array<[string, ECoin]>): Array<string> {
        let exPair:Array<string> = [pair[0], pair[1]];
        for(let r in rules) {
            // convert tickers of pair ot exchange format
            if(pair[0] === rules[r][1]) exPair[0] = rules[r][0];
            if(pair[1] === rules[r][1]) exPair[1] = rules[r][0];
        }
        return exPair;
    }


    existsTickers (pair: ITradingPair): boolean {
        if(ECoin[pair[0]] === undefined || ECoin[pair[1]] === undefined) {
            return false;
        }
        return true;
    }


    async cachePairs (pairs:Array<ITradingPair>, unknownPairs:Array<ITradingPair>, exTicker:string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const ticker = exTicker.toLowerCase();
            // cache pairs
            const result = {
                pairs: pairs,
                unknown: unknownPairs
            };
            const buffer = JSON.stringify(result);
            const cacheDir = await getCacheDir();
            const dir = path.resolve(cacheDir, 'pairs');

            if(!fs.existsSync(dir)) {
                await fs.mkdirSync(dir, { recursive:true });
            }

            // save cache
            const cacheFile = path.join(dir, ticker + '.' + this.PAIRS_CACHE);

            await fs.writeFile(cacheFile, buffer, err => {
                if(err) {
                    console.log('Error writing cache of pairs: ', err);
                    reject(false);
                } else {
                    resolve(true);
                }
            });
        })
    }


    async existsOnExchange (targetPair: ITradingPair): Promise<boolean> {
        let pairs = await this.getPairs();
        for(const [key, pair] of Object.entries(pairs)) {
            if (pair[0] === targetPair[0] && pair[1] === targetPair[1]) {
                return true;
            }
        }
        return false;
    }


    async subscribeToMarket (market:IMarket) {
        const socket = this.getSocket();
        const subscribeMessage = this.subscribeMessage(market);
        // send message
        console.log('->', subscribeMessage);
        socket.send(subscribeMessage);
    }


    async subscribeToMarketTrades (market:IMarket) {
        // get bitfinex socket
        const socket = this.getSocket();

        // add pair to subscriptions
        this.subs.marketTrades.push({market: market});


        if(socket.readyState === 1) {
            // socket is already opened
            // send subscribe message
            this.subscribeToMarket(market);
        }

    }


    loadMarkets (): Promise<IMarketsCache> {
        throw new Error("Method 'loadMarkets()' must be implemented");
    }


    subscribeMessage (market: IMarket) {
        throw new Error("Method 'subscribeMessage()' must be implemented");
    }


    parseMessage (data:string) {
        throw new Error("Method 'parseMessage()' must be implemented");
    }


    handleOpenSocket () {
        throw new Error("Method 'handleOpenSocket()' must be implemented");
    }


    handleCloseSocket () {
        throw new Error("Method 'handleCloseSocket()' must be implemented");
    }


    getSocketUri (): string {
        throw new Error("Method 'getSocketUri()' must be implemented");
    }


    async watchTrades (tradingPairs: Array<ITradingPair>)  {
        throw new Error("Method 'watchTrades()' must be implemented");
    }


}

export { Exchange, ETickerConvert, IMarketSub, ISubscriptions };
