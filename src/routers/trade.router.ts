import { Router } from 'express';
import { TradeController } from '../controllers/trade.controller.js';

const TradeRouter = new Router();

// get all trades
TradeRouter.get('/trades', TradeController.getTrades);

// delete trade by id
TradeRouter.delete('/trade/:id', TradeController.deleteTrade);

TradeRouter.delete('/trade', TradeController.dropTrades);

TradeRouter.get('/trades/count', TradeController.getCountTrades);

TradeRouter.post('/trade', TradeController.createBrokenTrade);


export { TradeRouter };
