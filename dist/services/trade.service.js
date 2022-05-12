import { pool as db } from "../db/db.js";
export default class TradeService {
    static async saveTrade(trade) {
        console.log(trade);
        const result = db.query('INSERT INTO trades (exTradeId, amount, mts, rate) VALUES ($1, $2, $3, $4)', [
            trade.exTradeId,
            trade.amount,
            trade.mts,
            trade.rate
        ]);
    }
    static async dropTrades() {
        db.query('TRUNCATE TABLE trades');
    }
}
//# sourceMappingURL=trade.service.js.map