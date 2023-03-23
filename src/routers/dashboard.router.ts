import { Router } from 'express';

import authMiddleware from '../middlewares/auth-middleware.js';

const DashboardRouter = new Router();

const controller = (req, res, next) => {
    console.log('|=>', req);
}

DashboardRouter.get('/board', controller);


export { DashboardRouter }

