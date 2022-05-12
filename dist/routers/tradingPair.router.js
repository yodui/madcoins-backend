import { Router } from 'express';
import tradingPairController from '../controllers/traidingPair.controller.js';
const router = new Router();
router.post('/pair', tradingPairController.createTradingPair);
router.get('/pair', tradingPairController.getTradingPairs);
router.get('/pair/:id', tradingPairController.getTradingPair);
router.put('/pair', tradingPairController.updateTradingPair);
router.delete('/pair/:id', tradingPairController.deleteTradingPair);
export { router as TradingPairRouter };
//# sourceMappingURL=tradingPair.router.js.map