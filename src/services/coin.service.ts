import { pool as db } from "../db/db.js";
import {ITradingPair, ECoin} from "../classes/Interfaces.js";


interface ICreateCoinResult {
    success: boolean, // result of operation
    countResults?: number, // count of results
    result?: Array<any>, // created coin
    coinId?: number, // created coin Id
    msg?: string // error message
}

interface ICoinsPairId extends Array<number|undefined> {
    0?: number|undefined,
    1?: number|undefined
}


class CoinService {

    static SQL_CREATE_COIN = 'INSERT INTO coins (ticker) VALUES ($1) RETURNING *';

    static SQL_FIND_COIN_BY_TICKER = 'SELECT coinid FROM coins WHERE ticker = $1';


    static async findCoinIdByTicker(ticker: ECoin): Promise<number|false> {
        const result = await db.query(this.SQL_FIND_COIN_BY_TICKER, [ticker]);
        if(result.rows.length) {
            return result.rows[0].coinid;
        }
        return false;
    }


    static async createCoinsFromPair(pair: ITradingPair): Promise<ICoinsPairId> {
        try {
            const result: ICoinsPairId = [];
            await Promise.all(pair.map(async (ticker: ECoin, index) =>
                new Promise<void>(async (resolve, reject) => {
                    let coinId = await CoinService.findCoinIdByTicker(ticker);
                    if (!coinId) {
                        const coinCreateResult = await CoinService.createCoinFromTicker(ticker);
                        coinId = coinCreateResult.coinId;
                    }
                    if (typeof coinId === 'number') {
                        result[index] = coinId;
                        resolve();
                    } else {
                        reject('Coin id is undefined');
                    }
                })
            ));
            return result;
        } catch (e) {
            console.log(e);
        }
    }


    static async createCoinFromTicker(ticker: ECoin): Promise<ICreateCoinResult> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await db.query(this.SQL_CREATE_COIN, [ticker]);
                // console.log(result);
                if (result.rowCount > 0) {
                    const res = result.rows[0];
                    // success
                    resolve({success: true, countResults: result.rowCount, coinId: res.coinid, result: res});
                } else {
                    // error
                    reject({success: false, msg: `Error in creating a new coin ${ticker}`});
                }
            } catch (e) {
                reject({ success: false, msg: `Error in adding a new coin ${ticker}: ${e}`});
            }
        })
    }


}

export {CoinService, ICoinsPairId};
