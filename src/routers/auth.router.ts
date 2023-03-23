import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

import authMiddleware from '../middlewares/auth-middleware.js';

const AuthRouter = new Router();

// user registration
AuthRouter.post('/signup', AuthController.signUp);

// remove user
AuthRouter.delete('/user/remove/:id', AuthController.removeUser);

// user account activation
AuthRouter.get('/activate/:link', AuthController.activate);

// check active user exists by email
AuthRouter.post('/user/exists', AuthController.userExists);

// refresh JWT token
AuthRouter.get('/token/refresh', AuthController.createRefreshToken);

// user login
AuthRouter.post('/login', AuthController.login);

// test
AuthRouter.post('/testData', AuthController.testData);

// user logout
AuthRouter.get('/logout', AuthController.logout);

// user test
AuthRouter.get('/users', authMiddleware, AuthController.getUsers);


export { AuthRouter };
