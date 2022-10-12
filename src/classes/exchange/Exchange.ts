import {ECoin, ITradingPair} from "../Interfaces.js";
import * as fs from "fs";
import path from 'path';
import getCacheDir from '../../utils/CacheDir.js';

enum ETickerConvert {
    PROJECT_VIEW,
    EXCHANGE_VIEW
}

class Exchange {

    // path to cache
    static PAIRS_CACHE:string = 'pairs.json';

    static pairs:Array<ITradingPair> = [];

    // Convert tickers to app format, ex. UST => USDT
    static toAppFormat(pair: ITradingPair, rules: Array<[string, ECoin]>) {
        for(let r in rules) {
            // convert tickers of pair ot application format
            if(pair[0] === rules[r][0]) pair[0] = rules[r][1];
            if(pair[1] === rules[r][0]) pair[1] = rules[r][1];
        }
        return pair;
    }

    // Convert tickers to exchange format, ex. USDT => UST
    static toExchangeFormat(pair: ITradingPair, rules: Array<[string, ECoin]>): Array<string> {
        let exPair:Array<string> = [pair[0], pair[1]];
        for(let r in rules) {
            // convert tickers of pair ot exchange format
            if(pair[0] === rules[r][1]) exPair[0] = rules[r][0];
            if(pair[1] === rules[r][1]) exPair[1] = rules[r][0];
        }
        return exPair;
    }

    static existsTickers(pair: ITradingPair): boolean {
        if(ECoin[pair[0]] === undefined || ECoin[pair[1]] === undefined) {
            return false;
        }
        return true;
    }

    static async cachePairs(pairs, exTicker:string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const ticker = exTicker.toLowerCase();
            // cache pairs
            const buffer = JSON.stringify(pairs);
            const cacheDir = await getCacheDir();

            // save cache
            const cacheFile = path.join(cacheDir, ticker + '.' + this.PAIRS_CACHE);

            await fs.writeFile(cacheFile, buffer, err => {
                if(err) {
                    console.log(err);
                    reject(false);
                } else {
                    resolve(true);
                }
            });
        })
    }

}

export { Exchange, ETickerConvert };
