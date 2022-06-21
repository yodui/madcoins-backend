import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';

const AuthRouter = new Router();

// user registration
AuthRouter.post('/registration', AuthController.registration);

// user account activation
AuthRouter.get('/activate/:link', AuthController.activate);

// refresh JWT token
AuthRouter.get('/token/refresh', AuthController.createRefreshToken);

// user login
AuthRouter.post('/login', AuthController.login);

// user logout
AuthRouter.post('/logout', AuthController.logout);

// user test
AuthRouter.get('/test', AuthController.getTestData);


export { AuthRouter };
