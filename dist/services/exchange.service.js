import { pool as db } from "../db/db.js";
export default class ExchangeService {
    static async createExchange(exchange) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query(`INSERT INTO exchanges (name, descr) VALUES ($1, $2) RETURNING *`, [exchange.name, exchange.descr]);
                if (result.rowCount > 0) {
                    resolve({ success: true, countResults: result.rowCount, exchange: result.rows[0] });
                }
                else {
                    reject({ success: false, countResults: result.rowCount, msg: 'Can\'t added a new exchange' });
                }
            }
            catch (err) {
                reject({ success: false, msg: 'Error in adding a new exchange' });
            }
        });
    }
    static async getExchanges() {
        return new Promise(async (resolve, reject) => {
            try {
                const results = await db.query(`SELECT * FROM exchanges ORDER BY exchanges."dateAdd" DESC`);
                resolve({ success: true, countResults: results.rowCount, exchanges: results.rows });
            }
            catch (err) {
                reject({ success: false, msg: 'Error in getting exchanges' });
            }
        });
    }
    static async getExchange(exId) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query(`SELECT * FROM exchanges WHERE exId = $1`, [exId]);
                resolve({ success: true, countResults: result.rowCount, exchange: result.rows[0] });
            }
            catch (err) {
                reject({ success: false, msg: 'Error in getting exchange by id ' + exId });
            }
        });
    }
    static async updateExchange(exchange) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query(`UPDATE exchanges SET name = $2, descr = $3 WHERE exId = $1 RETURNING *`, [exchange.exId, exchange.name, exchange.descr]);
                resolve({ success: true, countResults: result.rowCount, exchange: result.rows[0] });
            }
            catch (err) {
                reject({ success: false, msg: 'Error in updating exchange with id = ' + exchange.exId });
            }
        });
    }
    static async deleteExchange(exId) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query('DELETE FROM exchanges WHERE exId = $1', [exId]);
                resolve({ success: true, countResults: result.rowCount });
            }
            catch (err) {
                reject({ success: false, msg: 'Error in deleting an exchange id = ' + exId });
            }
        });
    }
}
//# sourceMappingURL=exchange.service.js.map