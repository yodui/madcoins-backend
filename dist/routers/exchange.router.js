import { Router } from 'express';
import ExchangeController from '../controllers/exchange.controller.js';
const router = new Router();
router.post('/exchange', ExchangeController.createExchange);
router.get('/exchange', ExchangeController.getExchanges);
router.get('/exchange/:id', ExchangeController.getExchange);
router.put('/exchange', ExchangeController.updateExchange);
router.delete('/exchange/:id', ExchangeController.deleteExchange);
export { router as ExchangeRouter };
//# sourceMappingURL=exchange.router.js.map