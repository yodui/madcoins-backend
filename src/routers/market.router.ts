import { Router } from 'express';
import { MarketController } from '../controllers/market.controller.js';

const MarketRouter = new Router();

// get all markets
MarketRouter.get('/market', MarketController.getMarkets);

// get one trading pair by id
MarketRouter.get('/market/:id', MarketController.getMarket);


export { MarketRouter };
