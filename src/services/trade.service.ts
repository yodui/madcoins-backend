import { pool as db } from "../db/db.js";
import { ITrade } from "../classes/Interfaces.js";
import { IListTradesOptions } from "../controllers/trade.controller.js";

import * as fs from "fs";
import * as path from "path";

import getCacheDir from '../utils/CacheDir.js';

import { ApiError } from '../exceptions/api-error.js';

export default class TradeService {

    static SQL_INSERT_TRADE = 'INSERT INTO trades (exId, exTicker, marketId, marketTicker, exTradeId, amount, mts, rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING RETURNING tradeId';

    static SQL_GET_TRADES = 'SELECT t.* FROM trades AS t ORDER BY mts DESC LIMIT $1 OFFSET $2';

    static SQL_GET_COUNT_TRADES = 'SELECT trades AS cnt FROM stats WHERE type = 0';

    static SQL_TRUNCATE_TRADES = 'TRUNCATE TABLE trades';

    static async saveTrade (trade: ITrade) {
        console.log('=>',trade);
        try {
            db.query(this.SQL_INSERT_TRADE,
                [
                    trade.exId,
                    trade.exTicker,
                    trade.marketId,
                    trade.marketTicker,
                    trade.exTradeId,
                    trade.amount,
                    trade.mts,
                    trade.rate
                ],
                (err, result) => {
                    if(err) throw new Error(err);
                    if(result.rows[0]) {
                        this.casheTrade(result.rows[0].tradeid, trade);
                    }
                }
            );

        } catch(e) {
            console.log('Trade saving error', e);
        }
    }


    private static async casheTrade (tradeId: number, trade: ITrade) {

        const baseDir = await getCacheDir();
        const sep = path.sep;
        const dir = path.resolve(baseDir, 'markets', trade.marketId.toString());
        if(!fs.existsSync(dir)) {
            // directory does not exists, create
            await fs.mkdirSync(dir, { recursive:true });
        }
        // trades.json
        const fileName = 'trades.json';
        const cacheFile = path.join(dir, fileName);
        // add trade ID
        trade.tradeId = tradeId;
        const tradeChunk = JSON.stringify(trade) + "\n";
        if(!fs.existsSync(cacheFile)) {
            // file with last trades does not exists, create a new
            console.log('File does not exists: ', cacheFile);
        }
        const fd = fs.createWriteStream(cacheFile, {flags: 'a'});
        fd.write(tradeChunk);
        fd.end();
    }


    static async countTrades () {
        const result = await db.query(this.SQL_GET_COUNT_TRADES);
        let totalTrades = 0;
        if(result.rows.length) {
             totalTrades = result.rows[0].cnt;
        }
        return totalTrades;
    }

    static async getTrades (options: IListTradesOptions) {
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

    static async dropTrades () {
        db.query(this.SQL_TRUNCATE_TRADES);
    }

    private static mapFieldsToProps (row) {
        return {
            tradeId: row.tradeId,
            exTicker: row.exTicker,
            pair: null
        }
    }

}
