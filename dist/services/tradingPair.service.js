import { pool as db } from "../db/db.js";
export default class TradingPairService {
    static async getTradingPair(pairId) {
    }
    static async markPairAsWatched(pairId) {
        const result = await db.query('UPDATE tradingPairs SET watched = 1 WHERE pairId = $1', [pairId]);
        console.log(result);
    }
}
//# sourceMappingURL=tradingPair.service.js.map