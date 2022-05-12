import ExchangeService from "../services/exchange.service.js";
export default class exchangeController {
    static async createExchange(req, res) {
        try {
            const result = await ExchangeService.createExchange(req.body);
            return res.status(200).send(result);
        }
        catch (err) {
            return res.status(500).send(err);
        }
    }
    static async getExchanges(req, res) {
        try {
            const result = await ExchangeService.getExchanges();
            return res.status(200).send(result);
        }
        catch (err) {
            return res.status(500).send(err);
        }
    }
    static async getExchange(req, res) {
        try {
            const exId = parseInt(req.params.id);
            const result = await ExchangeService.getExchange(exId);
            return res.status(200).send(result);
        }
        catch (err) {
            return res.status(500).send(err);
        }
    }
    static async updateExchange(req, res) {
        try {
            const result = await ExchangeService.updateExchange(req.body);
            return res.status(200).send(result);
        }
        catch (err) {
            return res.status(500).send(err);
        }
    }
    static async deleteExchange(req, res) {
        try {
            const exId = parseInt(req.params.id);
            const result = await ExchangeService.deleteExchange(exId);
            return res.status(200).send(result);
        }
        catch (err) {
            return res.status(500).send(err);
        }
    }
}
//# sourceMappingURL=exchange.controller.js.map