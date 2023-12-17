import url from 'url';

import { query, validationResult } from 'express-validator';
import { ApiError } from '../exceptions/api-error.js';

import MarketService from '../services/market.service.js';

interface IMarketListOptions {
    limit: number,
    offset: number
};

class MarketController {

    static async getMarkets(req, res, next) {
        try {
            await MarketController.validateMarketListOptions(req);

            // default values
            let [limit,offset] = [20,0];
            const query = url.parse(req.url, true).query;

            // check
            if(typeof query.limit === 'string') limit = Number.parseInt(query.limit);
            if(typeof query.offset === 'string') offset = Number.parseInt(query.offset);

            const listOfMarkets = await MarketService.getMarkets({limit: limit, offset: offset});
            res.status(200).send(listOfMarkets);
        } catch(err) {
            next(err);
        }
    }

    static async getMarket(req, res, next) {

    }


    static async validateMarketListOptions(req) {
        await query('limit').optional()
            .isNumeric().withMessage('Limit must be numeric parameter').bail()
            .isInt({ min:1, max:100 }).withMessage('Limit must be in range 1-100').run(req);

        await query('offset').optional()
            .isNumeric().withMessage('Offset must be numeric parameter').bail()
            .isInt({ min:0 }).withMessage('Offset must be more than 0').run(req);

        const validationErrors = validationResult(req);
        if(!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('Markets list parameters validation error', validationErrors.array());
        }
    }

}

export { IMarketListOptions, MarketController };
