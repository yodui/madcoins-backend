import { Router } from 'express';
import TradeController from '../controllers/trade.controller.js';
const router = new Router();
router.get('/trade', TradeController.getTrades);
router.delete('/trade/:id', TradeController.deleteTrade);
router.delete('/trade', TradeController.dropTrades);
export { router as TradeRouter };
//# sourceMappingURL=trade.router.js.map