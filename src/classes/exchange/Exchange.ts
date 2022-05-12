import {Coin, ITradingPair} from "../Interfaces.js";

enum ETickerConvert {
    PROJECT_VIEW,
    EXCHANGE_VIEW
}

class Exchange {

    // path to cache
    static PAIRS_CACHE:string = 'pairs.cache.json';

    static pairs:Array<ITradingPair> = [];

    // Convert tickers to app format, ex. UST => USDT
    static toAppFormat(pair: ITradingPair, rules: Array<[string, Coin]>) {
        for(let r in rules) {
            // convert tickers of pair ot application format
            if(pair[0] === rules[r][0]) pair[0] = rules[r][1];
            if(pair[1] === rules[r][0]) pair[1] = rules[r][1];
        }
        return pair;
    }

    // Convert tickers to exchange format, ex. USDT => UST
    static toExchangeFormat(pair: ITradingPair, rules: Array<[string, Coin]>) {
        let exPair:Array<string> = [pair[0], pair[1]];
        for(let r in rules) {
            // convert tickers of pair ot exchange format
            if(pair[0] === rules[r][1]) exPair[0] = rules[r][0];
            if(pair[1] === rules[r][1]) exPair[1] = rules[r][0];
        }
        return exPair;
    }

    static existsTickers(pair: ITradingPair): boolean {
        if(Coin[pair[0]] === undefined || Coin[pair[1]] === undefined) {
            return false;
        }
        return true;
    }

}

export { Exchange, ETickerConvert };
