import { pool as db } from "../db/db.js";
import {IExchange} from "../classes/Interfaces.js";

interface IExchangeServiceResult {
    success: boolean, // verdict of operation
    countResults?: number, // count of results
    exchange?: IExchange, // one exchange (updated or added)
    exchanges?: Array<IExchange>, // array of exchanges
    msg?: string, // error message
}

interface IExchangeSearchResult {
    success: boolean, // result of searching
    exId?: number|false, // exchange id
    msg?: string, // error message
}

export default class ExchangeService {

    static SQL_CREATE_EXCHANGE = 'INSERT INTO exchanges (name, ticker, descr) VALUES ($1, $2, $3) RETURNING *';

    static SQL_GET_EXCHANGES = 'SELECT * FROM exchanges ORDER BY exchanges."dateAdd" DESC';

    static SQL_GET_EXCHANGE_BY_ID = 'SELECT * FROM exchanges WHERE exId = $1';

    static SQL_FIND_EXCHANGE_BY_TICKER = 'SELECT exId FROM exchanges WHERE ticker = $1';


    static async createExchange(exchange: IExchange): Promise<IExchangeServiceResult> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query(this.SQL_CREATE_EXCHANGE, [exchange.name, exchange.ticker, exchange.descr]);
                if(result.rowCount > 0) {
                    // success
                    resolve( { success: true, countResults: result.rowCount, exchange: result.rows[0] });
                } else {
                    // not added
                    reject({ success: false, countResults: result.rowCount, msg: 'Can\'t added a new exchange' });
                }

            } catch (err) {
                reject({ success: false, msg: 'Error in adding a new exchange: ' + err });
            }
        })
    }


    static async getExchanges() {
        return new Promise<IExchangeServiceResult>(async (resolve, reject) => {
            try {
                const results = await db.query(this.SQL_GET_EXCHANGES);
                resolve({success: true, countResults: results.rowCount, exchanges: results.rows});
            } catch (err) {
                reject({ success: false, msg: 'Error in getting exchanges, error: ' + err });
            }
        })
    }


    static async findExchangeByTicker(ticker: string): Promise<number|false> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query(this.SQL_FIND_EXCHANGE_BY_TICKER, [ticker]);
                if(result.rowCount > 0) {
                    resolve(result.rows[0].exid);
                } else {
                    resolve(false);
                }
            } catch (err) {
                reject(err);
            }
        })
    }


    static async getExchange(exId: number) {
        return new Promise<IExchangeServiceResult>(async (resolve, reject) => {
            try {
                const result = await db.query(this.SQL_GET_EXCHANGE_BY_ID, [exId]);
                resolve({success: true, countResults: result.rowCount, exchange: result.rows[0]})
            } catch (err) {
                reject({success: false, msg: 'Error in getting exchange by id '+exId})
            }
        })
    }


    static async updateExchange(exchange: IExchange) {
        return new Promise<IExchangeServiceResult>(async (resolve, reject) => {
            try {
                const result = await db.query(`UPDATE exchanges SET name = $2, descr = $3 WHERE exId = $1 RETURNING *`, [exchange.exId, exchange.name, exchange.descr]);
                resolve({success: true, countResults: result.rowCount, exchange: result.rows[0]});
            } catch (err) {
                reject({success: false, msg: 'Error in updating exchange with id = '+exchange.exId});
            }
        })
    }


    static async deleteExchange(exId: number) {
        return new Promise<IExchangeServiceResult>(async (resolve, reject) => {
            try {
                const result = await db.query('DELETE FROM exchanges WHERE exId = $1', [exId]);
                resolve({success: true, countResults: result.rowCount});
            } catch (err) {
                reject({success: false, msg: 'Error in deleting an exchange id = '+exId})
            }
        })
    }


}
