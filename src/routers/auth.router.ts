import { Router } from 'express';
import ExchangeController from '../controllers/exchange.controller.js';

const router = new Router();

// create exchange
router.post('/exchange', ExchangeController.createExchange);

// get all exchanges
router.get('/exchange', ExchangeController.getExchanges);

// get one exchange by id
router.get('/exchange/:id', ExchangeController.getExchange);

// update exchange
router.put('/exchange', ExchangeController.updateExchange);

// delete exchange
router.delete('/exchange/:id', ExchangeController.deleteExchange)


export { router as ExchangeRouter };
