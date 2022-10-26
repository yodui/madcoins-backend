import TradeService from "../services/trade.service.js";
import url from 'url';

import { query, validationResult } from 'express-validator';
import ApiError from '../exceptions/api-error.js';

import { ITrade, ECoin } from '../classes/Interfaces.js';

interface IListTradesOptions {
    limit: number,
    offset: number
}

class TradeController {

    static async getTrades(req, res, next) {
        try {
            const query = url.parse(req.url, true).query;
            // validate params
            await TradeController.validateTradeListOptions(req);
            // default values
            let [limit,offset] = [20,0];
            // check
            if(typeof query.limit === 'string') limit = Number.parseInt(query.limit);
            if(typeof query.offset === 'string') offset = Number.parseInt(query.offset);

            const listOfTrades = await TradeService.getTrades({limit: limit, offset: offset});
            res.status(200).send(listOfTrades);
        } catch(err) {
            next(err);
        }
    }

    static async validateTradeListOptions(req) {
        await query('limit').optional()
            .isNumeric().withMessage('Limit must be numeric parameter').bail()
            .isInt({ min:1, max:100 }).withMessage('Limit must be in range 1-100').run(req);

        await query('offset').optional()
            .isNumeric().withMessage('Offset must be numeric parameter').bail()
            .isInt({ min:0 }).withMessage('Offset must be more than 0').run(req);

        const validationErrors = validationResult(req);
        if(!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('Trade list parameters validation error', validationErrors.array());
        }
    }

    static async createBrokenTrade(req, res, next) {
        try {
            const brokenTrade: ITrade = {
                exId: 1,
                pair: [ECoin.ETH, ECoin.USDT],
                exTicker: 'BITFINEX',
                marketId: 1,
                exTradeId: 1229983109,
                amount: -0.002,
                mts: 1666257319960,
                rate: 1290.9
            };
            await TradeService.saveTrade(brokenTrade);
            //return next(ApiError.BadRequest('Create trade test error'));
        } catch(err) {
            next(err);
        }
    }

    static async dropTrades(req, res) {
        await TradeService.dropTrades();
        res.status(200).send('OK');
    }

    static async deleteTrade() {
        console.log('Delete trade by id...');
    }

    static async getCountTrades(req, res) {
        const countTrades = await TradeService.countTrades();
        res.status(200).send(countTrades);
    }

}


export { IListTradesOptions, TradeController };
