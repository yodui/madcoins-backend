import {pool as db} from "../db/db.js";

import {ITradingPair, IMarket, ECoin} from "../classes/Interfaces.js";
import {CoinService, ICoinsPairId} from '../services/coin.service.js';

import {IMarketListOptions} from "../controllers/market.controller.js";

export default class MarketService {


    static SQL_SELECT_PAIR_BY_EXCHANGE_AND_COINS_ID = 'SELECT * FROM markets WHERE exId=$1 AND baseCoinId = $2 AND quoteCoinId = $3';

    static SQL_GET_MARKETS = 'SELECT m.*, e.ticker AS exchangeTicker, e.name AS exchangeName FROM markets AS m, exchanges AS e WHERE m.exid = e.exid ORDER BY marketid ASC LIMIT $1 OFFSET $2';

    static SQL_GET_COUNT_MARKETS = 'SELECT markets AS cnt FROM stats';

    static SQL_INSERT_MARKET = 'INSERT INTO markets (exId, baseCoinId, quoteCoinId, baseTicker, quoteTicker) VALUES ($1, $2, $3, $4, $5) RETURNING *';

    static SQL_MARK_AS_WATCHED_BY_MARKET_ID = 'UPDATE market SET watched = 1 WHERE marketId = $1';

    static SQL_GET_TICKERS_BY_MARKET_ID = 'SELECT (baseTicker || \'/\' || quoteTicker) AS ticker FROM markets WHERE marketId = $1';


    static async getMarkets(options: IMarketListOptions) {

        const marketsData = {
            count: await MarketService.countMarkets(),
            rows:[]
        }
        console.log('getMarkets', options);
        const result = await db.query(this.SQL_GET_MARKETS, [options.limit, options.offset]);
        result.rows.forEach(row => {
            marketsData.rows.push(row);
        });
        return marketsData;
    }

    static async countMarkets() {
        const result = await db.query(this.SQL_GET_COUNT_MARKETS);
        let totalMarkets = 0;
        if(result.rows.length) {
            totalMarkets = result.rows[0].cnt;
        }
        return totalMarkets;
    }


    static async getMarket(marketId: number): Promise<ITradingPair|boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                //const result = db.query()
            } catch(e) {
                reject(e);
            }
        })
    }

    static tickerByPair (pair: ITradingPair) {
        return pair[0] + '/' + pair[1];
    }

    static async findMarket(ids: ICoinsPairId, exId: number): Promise<number|boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query(this.SQL_SELECT_PAIR_BY_EXCHANGE_AND_COINS_ID, [exId, ids[0], ids[1]]);
                if(result.rowCount > 0) {
                    // success
                    resolve(result.rows[0].marketid);
                } else {
                    // not found
                    resolve(false);
                }
            } catch(e) {
                reject(e);
            }
        })
    }

    static async getTickerByMarketId (marketId: number): Promise<string|boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query(this.SQL_GET_TICKERS_BY_MARKET_ID, [marketId]);
                if(result.rowCount > 0) {
                    resolve(result.rows[0].ticker);
                }
            } catch(e) {
                reject(false);
            }
        })
    }


    static async createMarket(market: IMarket): Promise<number|boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query(this.SQL_INSERT_MARKET, [
                        market.exId, market.baseCoinId, market.quoteCoinId, market.tradingPair[0], market.tradingPair[1]
                    ]
                );
                if(result.rowCount > 0) {
                    // success
                    resolve(result.rows[0].marketid);
                } else {
                    resolve(false);
                }

            } catch (e) {
                reject(e);
            }
        })
    }

    static async markMarketAsWatched(marketId: number) {
        const result = await db.query(this.SQL_MARK_AS_WATCHED_BY_MARKET_ID, [marketId]);
        //console.log(result);
    }

}
