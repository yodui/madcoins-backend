import { Router } from 'express';
import tradingPairController from '../controllers/traidingPair.controller.js';

const router = new Router();

// create trading pair
router.post('/pair', tradingPairController.createTradingPair);

// get all trading pairs
router.get('/pair', tradingPairController.getTradingPairs);

// get one trading pair by id
router.get('/pair/:id', tradingPairController.getTradingPair);

// update trading pair
router.put('/pair', tradingPairController.updateTradingPair);

// delete trading pair
router.delete('/pair/:id', tradingPairController.deleteTradingPair)


export { router as TradingPairRouter };
