import { pool as db } from "../db/db.js";
import {ITrade} from "../classes/Interfaces.js";

export default class TradeService {

    static async saveTrade(trade: ITrade) {
        console.log(trade);
        const result = db.query('INSERT INTO trades (exTradeId, amount, mts, rate) VALUES ($1, $2, $3, $4)',
            [
                trade.exTradeId,
                trade.amount,
                trade.mts,
                trade.rate
            ]
        );
    }

    static async dropTrades() {
        db.query('TRUNCATE TABLE trades');
    }

}
