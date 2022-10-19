import TradeService from "../services/trade.service.js";

export default class TradeController {

    static async getTrades(req, res) {
        const listOfTrades = await TradeService.getTrades(20);
        res.status(200).send(listOfTrades);
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
