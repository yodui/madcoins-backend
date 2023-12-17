
import {pool as db} from "../db/db.js";
import { ApiError } from '../exceptions/api-error.js';


export default class TradingPairController {

    static async createTradingPair(req, res) {
        res.json('Create trading pair');
    }

    static async getTradingPairs(req, res, next) {
        try {
            res.json('Get trading pairs');
            //const listOfTradingPairs = await TradingPairService.;
        } catch(err) {
            next(err);
        }
    }

    static async getTradingPair(req, res) {
        res.json('Get one trading pair by id');
    }


    static async updateTradingPair(req, res) {
        res.json('Update trading pair');
    }


    static async deleteTradingPair(req, res) {
        res.json('Delete trading pair');
    }

}
