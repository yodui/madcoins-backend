import {Exchange} from '../Exchange.js';
import axios from 'axios';
import {ITradingPair, ECoin} from '../../Interfaces.js';

class PoloniexApi extends Exchange {

    static exTicker:string = 'POLONIEX';

    // Ticker conversation below app and exchange formats
    // For what? Some times exchange invent unique ticker names, ex. UST instead of USDT
    // Converting format: exchange format => to Coin.TICKER (app format)
    static convertRules:Array<[string, ECoin]> = [
        //['USDT', ECoin.USDTEST],
    ];

    static URI_PUBLIC_API = 'https://api.poloniex.com/';

    static URI_CURRENCIES = 'currencies?includeMultiChainCurrencies=true';

    static URI_MARKETS = 'markets';

    static async loadMarkets() {
        return new Promise(async (resolve, reject) => {
            const endpoint: string = this.URI_PUBLIC_API + this.URI_MARKETS;
            try {
                const response = await axios.get(endpoint);
                let pairs:Array<ITradingPair> = [];

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
                    }
                })

                await this.cachePairs(pairs, this.exTicker);

                resolve(response);
            } catch (e) {
                reject(e);
            }
        })
    }


}

export default PoloniexApi;
