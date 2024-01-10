import { Router } from 'express';
import tradingPairController from '../controllers/traidingPair.controller.js';

const TradingPairRouter = new Router();

// create trading pair
TradingPairRouter.post('/pair', tradingPairController.createTradingPair);

// get all trading pairs
TradingPairRouter.get('/pair', tradingPairController.getTradingPairs);

// get one trading pair by id
TradingPairRouter.get('/pair/:id', tradingPairController.getTradingPair);

// update trading pair
TradingPairRouter.put('/pair', tradingPairController.updateTradingPair);

// delete trading pair
TradingPairRouter.delete('/pair/:id', tradingPairController.deleteTradingPair)


export { TradingPairRouter };
