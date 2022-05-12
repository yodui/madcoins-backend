import { pool as db } from "../db/db.js";
import {IExchange} from "../classes/Interfaces.js";

interface IExchangeServiceResult {
    success: boolean, // verdict of operation
    countResults?: number, // count of results
    exchange?: IExchange, // one exchange (updated or added)
    exchanges?: Array<IExchange>, // array of exchanges
    msg?: string, // error message
}

export default class ExchangeService {

    static async createExchange(exchange: IExchange) {
        return new Promise<IExchangeServiceResult>(async (resolve, reject) => {
            try {
                const result = await db.query(`INSERT INTO exchanges (name, descr) VALUES ($1, $2) RETURNING *`, [exchange.name, exchange.descr]);
                if(result.rowCount > 0) {
                    // success
                    resolve( { success: true, countResults: result.rowCount, exchange: result.rows[0] });
                } else {
                    // not added
                    reject({ success: false, countResults: result.rowCount, msg: 'Can\'t added a new exchange' });
                }

            } catch (err) {
                reject({ success: false, msg: 'Error in adding a new exchange' });
            }
        })
    }

    static async getExchanges() {
        return new Promise<IExchangeServiceResult>(async (resolve, reject) => {
            try {
                const results = await db.query(`SELECT * FROM exchanges ORDER BY exchanges."dateAdd" DESC`);
                resolve({success: true, countResults: results.rowCount, exchanges: results.rows});
            } catch (err) {
                reject({ success: false, msg: 'Error in getting exchanges' });
            }
        })
    }

    static async getExchange(exId: number) {
        return new Promise<IExchangeServiceResult>(async (resolve, reject) => {
            try {
                const result = await db.query(`SELECT * FROM exchanges WHERE exId = $1`, [exId]);
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
