import ws from "ws";
import * as fs from "fs";

import axios from "axios";
import {ITradingPair, ITrade, ECoin} from "../../Interfaces.js";
import {Exchange, ETickerConvert} from '../Exchange.js';
import TradeService from "../../../services/trade.service.js";



class BitfinexApi extends Exchange {

    static exTicker = 'BITFINEX';

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
    GET_TICKERS = 'tickers';

    // --------------------
    // Web socket endpoint
    static URI_WS:string = 'wss://api-pub.bitfinex.com/ws/2';

    // --------------------
    // Authenticated API
    URI_AUTH:string = 'https://api.bitfinex.com/v2/';

    // --------------------
    // configs
    static URI_CONF_LIST_PAIRS:string = 'conf/pub:list:pair:exchange';

    static loadPairs() {
        return new Promise<Array<ITradingPair>>(async (resolve, reject) => {
            const endpoint: string = this.URI_PUBLIC + this.URI_CONF_LIST_PAIRS;
            try {
                let response = await axios.get(endpoint);
                let pairs:Array<ITradingPair> = [];

                const rawPairs = response.data[0];
                // parse pairs
                rawPairs.map(strPair => {
                    let sepPos = strPair.indexOf(':');
                    let rawPair:ITradingPair = [undefined, undefined];

                    if(sepPos !== -1) {
                        // we have separator in pair string
                        rawPair[0] = strPair.slice(0, sepPos);
                        rawPair[1] = strPair.slice(sepPos + 1);
                    } else {
                        // we have standard names in pair, 3 letters for each
                        rawPair[0] = strPair.slice(0, 3);
                        rawPair[1] = strPair.slice(3);
                    }
                    const pair = this.toAppFormat(rawPair, this.convertRules);
                    if(this.existsTickers(pair)) {
                        pairs.push(pair);
                    }
                })

                await this.cachePairs(pairs);
                resolve(pairs);

            } catch (err) {
                reject(err);
            }
        })
    }

    static async cachePairs(pairs): Promise<boolean> {
        // cache pairs
        const buffer = JSON.stringify(pairs);
        // save cache
        await fs.writeFile(new URL(this.PAIRS_CACHE, import.meta.url), buffer, { flag: "w"}, err => {
            if(err) return false;
        });
        return true;
    }

    static getPairs (forceUpdate = false) {
        return new Promise(async (resolve, reject) => {
            try {
                if(!this.pairs.length || forceUpdate === true) {
                    // get and save trading pairs
                    this.pairs = await this.loadPairs();
                }
                resolve(this.pairs);
            } catch (err) {
                reject(err);
            }
        });
    }

    static getPairsByCoin(coinTicker: ECoin) {
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

    static async subscribeToTrades (pair:ITradingPair, onMessageHandler) {
        // convert pair to exchange format
        const exPair = this.toExchangeFormat(pair, this.convertRules);
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
                    let trade = {
                        exTicker: this.exTicker,
                        pair: pair,
                        exTradeId: raw[0],
                        mts: raw[1],
                        amount: raw[2],
                        rate: raw[3]
                    }

                    console.log('');
                    onMessageHandler(trade);
                }

            }
        })
    }

    static watchTrades(tradingPairs: Array<ITradingPair>): void {
        tradingPairs.map(async pair => {
            // check exists in exchange
            const isExists = await this.existsOnExchange(pair);
            if (false === isExists) {
                console.log(pair, ' - pair is not exists');
            } else {
                console.log(pair, ' - subscribe to pair ');
                this.subscribeToTrades(pair, (trade: ITrade) => {
                    TradeService.saveTrade(trade);
                })
            }

        });
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
