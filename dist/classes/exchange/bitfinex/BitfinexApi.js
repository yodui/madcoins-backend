import ws from "ws";
import * as fs from "fs";
import axios from "axios";
import { Coin } from "../../Interfaces.js";
import { Exchange } from '../Exchange.js';
import TradeService from "../../../services/trade.service.js";
class BitfinexApi extends Exchange {
    static exTicker = 'BITFINEX';
    static convertRules = [
        ['UST', Coin.USDT],
        ['USD', Coin.USDC]
    ];
    static key = '';
    static secretKey = '';
    static URI_PUBLIC = 'https://api-pub.bitfinex.com/v2/';
    GET_TICKERS = 'tickers';
    static URI_WS = 'wss://api-pub.bitfinex.com/ws/2';
    URI_AUTH = 'https://api.bitfinex.com/v2/';
    static URI_CONF_LIST_PAIRS = 'conf/pub:list:pair:exchange';
    static loadPairs() {
        return new Promise(async (resolve, reject) => {
            const endpoint = this.URI_PUBLIC + this.URI_CONF_LIST_PAIRS;
            try {
                let response = await axios.get(endpoint);
                let pairs = [];
                const rawPairs = response.data[0];
                rawPairs.map(strPair => {
                    let sepPos = strPair.indexOf(':');
                    let rawPair = [undefined, undefined];
                    if (sepPos !== -1) {
                        rawPair[0] = strPair.slice(0, sepPos);
                        rawPair[1] = strPair.slice(sepPos + 1);
                    }
                    else {
                        rawPair[0] = strPair.slice(0, 3);
                        rawPair[1] = strPair.slice(3);
                    }
                    const pair = this.toAppFormat(rawPair, this.convertRules);
                    if (this.existsTickers(pair)) {
                        pairs.push(pair);
                    }
                });
                await this.cachePairs(pairs);
                resolve(pairs);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    static async cachePairs(pairs) {
        const buffer = JSON.stringify(pairs);
        await fs.writeFile(new URL(this.PAIRS_CACHE, import.meta.url), buffer, { flag: "w" }, err => {
            if (err)
                return false;
        });
        return true;
    }
    static getPairs(forceUpdate = false) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.pairs.length || forceUpdate === true) {
                    this.pairs = await this.loadPairs();
                }
                resolve(this.pairs);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    static getPairsByCoin(coinTicker) {
        return new Promise(async (resolve, reject) => {
            try {
                const pairs = await this.getPairs();
                const filteredPairs = Object.values(pairs).filter(pair => pair.includes(coinTicker));
                resolve(filteredPairs);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    static async subscribeToTrades(pair, onMessageHandler) {
        const exPair = this.toExchangeFormat(pair, this.convertRules);
        const msg = JSON.stringify({
            event: 'subscribe',
            channel: 'trades',
            symbol: 't' + (exPair.join('')).toUpperCase()
        });
        const socket = new ws(this.URI_WS);
        socket.on('open', () => socket.send(msg));
        socket.on('message', msg => {
            let data = JSON.parse(msg);
            const channelId = parseInt(data[0]);
            const type = data[1];
            if (type === 'te') {
                const raw = data[2];
                if (undefined !== raw) {
                    const trades = [];
                    let trade = {
                        exTicker: this.exTicker,
                        pair: pair,
                        exTradeId: raw[0],
                        mts: raw[1],
                        amount: raw[2],
                        rate: raw[3]
                    };
                    console.log('');
                    onMessageHandler(trade);
                }
            }
        });
    }
    static watchTrades(tradingPairs) {
        tradingPairs.map(async (pair) => {
            const isExists = await this.existsOnExchange(pair);
            if (false === isExists) {
                console.log(pair, ' - pair is not exists');
            }
            else {
                console.log(pair, ' - subscribe to pair ');
                this.subscribeToTrades(pair, (trade) => {
                    TradeService.saveTrade(trade);
                });
            }
        });
    }
    static async existsOnExchange(targetPair) {
        let pairs = await this.getPairs();
        for (const [key, pair] of Object.entries(pairs)) {
            if (pair[0] === targetPair[0] && pair[1] === targetPair[1]) {
                return true;
            }
        }
        return false;
    }
}
export default BitfinexApi;
//# sourceMappingURL=BitfinexApi.js.map