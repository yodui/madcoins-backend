import { pool as db } from "../db/db.js";
import { ITrade } from "../classes/Interfaces.js";
import { IListTradesOptions } from "../controllers/trade.controller.js";

import { ApiError } from '../exceptions/api-error.js';

export default class TradeService {

    static SQL_INSERT_TRADE = 'INSERT INTO trades (exId, exTicker, marketId, marketTicker, exTradeId, amount, mts, rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';

    static SQL_GET_TRADES = 'SELECT t.* FROM trades AS t ORDER BY mts DESC LIMIT $1 OFFSET $2';

    static SQL_GET_COUNT_TRADES = 'SELECT trades AS cnt FROM stats WHERE type = 0';

    static SQL_TRUNCATE_TRADES = 'TRUNCATE TABLE trades';

    static async saveTrade(trade: ITrade) {
        console.log('=>',trade);
        try {
            const result = await db.query(this.SQL_INSERT_TRADE,
                [
                    trade.exId,
                    trade.exTicker,
                    trade.marketId,
                    trade.marketTicker,
                    trade.exTradeId,
                    trade.amount,
                    trade.mts,
                    trade.rate
                ]
            );
        } catch(e) {
            console.log('Trade saving error', e.detail);
        }
    }

    static async countTrades() {
        const result = await db.query(this.SQL_GET_COUNT_TRADES);
        let totalTrades = 0;
        if(result.rows.length) {
             totalTrades = result.rows[0].cnt;
        }
        return totalTrades;
    }

    static async getTrades(options: IListTradesOptions) {
        const trades = {
            count: await TradeService.countTrades(),
            rows: []
        };
        console.log('getTrades', options);
        const result = await db.query(this.SQL_GET_TRADES, [options.limit, options.offset]);
        result.rows.forEach(row => {
            trades.rows.push(row);
        });
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
