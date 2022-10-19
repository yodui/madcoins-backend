import { pool as db } from "../db/db.js";
import {ITrade} from "../classes/Interfaces.js";

export default class TradeService {

    static SQL_INSERT_TRADE = 'INSERT INTO trades (exId, exTicker, marketId, exTradeId, amount, mts, rate) VALUES ($1, $2, $3, $4, $5, $6, $7)';

    static SQL_GET_TRADES = 'SELECT t.*, (SELECT m.baseTicker || \'/\' || m.quoteTicker FROM markets AS m WHERE t.marketId = m.marketId) AS tickers FROM trades AS t ORDER BY mts DESC LIMIT $1';

    static SQL_GET_COUNT_TRADES = 'SELECT count(*) AS cnt FROM trades';

    static SQL_TRUNCATE_TRADES = 'TRUNCATE TABLE trades';

    static async saveTrade(trade: ITrade) {
        console.log(trade);
        const result = db.query(this.SQL_INSERT_TRADE,
            [
                trade.exId,
                trade.exTicker,
                trade.marketId,
                trade.exTradeId,
                trade.amount,
                trade.mts,
                trade.rate
            ]
        );
    }


    static async countTrades() {
        const result = await db.query(this.SQL_GET_COUNT_TRADES);
        let totalTrades = 0;
        if(result.rows.length) {
             totalTrades = result.rows[0].cnt;
        }
        return {totalTrades: totalTrades}
    }


    static async getTrades(limit:number = 10) {
        const trades = [];
        const result = await db.query(this.SQL_GET_TRADES, [limit]);
        result.rows.forEach(row => {
            trades.push(row);
        })
        return trades;
    }

    static async dropTrades() {
        db.query(this.SQL_TRUNCATE_TRADES);
    }


    private static mapFieldsToProps(row) {
        return {
            tradeId: row.tradeId,
            exTicker: row.exTicker,
            pair: null
        }
    }



}
