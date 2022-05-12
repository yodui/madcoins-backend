import TradeService from "../services/trade.service.js";
export default class TradeController {
    static async getTrades() {
        console.log('Get trades...');
    }
    static async dropTrades(req, res) {
        await TradeService.dropTrades();
        res.status(200).send('OK');
    }
    static async deleteTrade() {
        console.log('Delete trade by id...');
    }
}
//# sourceMappingURL=trade.controller.js.map