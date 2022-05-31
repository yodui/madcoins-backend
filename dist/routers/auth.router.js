import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
const AuthRouter = new Router();
AuthRouter.post('/registration', AuthController.registration);
AuthRouter.get('/activate/:link', AuthController.activate);
AuthRouter.get('/token/refresh', AuthController.createRefreshToken);
AuthRouter.post('/login', AuthController.login);
AuthRouter.post('/logout', AuthController.logout);
AuthRouter.get('/test', AuthController.getTestData);
export { AuthRouter };
//# sourceMappingURL=auth.router.js.map