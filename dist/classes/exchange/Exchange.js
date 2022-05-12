import { Coin } from "../Interfaces.js";
var ETickerConvert;
(function (ETickerConvert) {
    ETickerConvert[ETickerConvert["PROJECT_VIEW"] = 0] = "PROJECT_VIEW";
    ETickerConvert[ETickerConvert["EXCHANGE_VIEW"] = 1] = "EXCHANGE_VIEW";
})(ETickerConvert || (ETickerConvert = {}));
class Exchange {
    static PAIRS_CACHE = 'pairs.cache.json';
    static pairs = [];
    static toAppFormat(pair, rules) {
        for (let r in rules) {
            if (pair[0] === rules[r][0])
                pair[0] = rules[r][1];
            if (pair[1] === rules[r][0])
                pair[1] = rules[r][1];
        }
        return pair;
    }
    static toExchangeFormat(pair, rules) {
        let exPair = [pair[0], pair[1]];
        for (let r in rules) {
            if (pair[0] === rules[r][1])
                exPair[0] = rules[r][0];
            if (pair[1] === rules[r][1])
                exPair[1] = rules[r][0];
        }
        return exPair;
    }
    static existsTickers(pair) {
        if (Coin[pair[0]] === undefined || Coin[pair[1]] === undefined) {
            return false;
        }
        return true;
    }
}
export { Exchange, ETickerConvert };
//# sourceMappingURL=Exchange.js.map