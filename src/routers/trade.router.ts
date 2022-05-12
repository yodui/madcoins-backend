import { Router } from 'express';
import TradeController from '../controllers/trade.controller.js';

const router = new Router();

// get all trades
router.get('/trade', TradeController.getTrades);

// delete trade by id
router.delete('/trade/:id', TradeController.deleteTrade)

router.delete('/trade', TradeController.dropTrades)


export { router as TradeRouter };
