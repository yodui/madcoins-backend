import {pool as db} from "../db/db.js";

export default class TradingPairService {

    static async getTradingPair(pairId: number) {

    }

    static async markPairAsWatched(pairId: number) {
        const result = await db.query('UPDATE tradingPairs SET watched = 1 WHERE pairId = $1', [pairId])
        console.log(result);
    }

}
