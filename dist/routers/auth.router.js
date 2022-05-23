import { Router } from 'express';
const AuthRouter = new Router();
AuthRouter.post('/registration');
AuthRouter.get('/activate/:link');
AuthRouter.get('/token/refresh');
AuthRouter.post('/login');
AuthRouter.post('/logout');
export { AuthRouter };
//# sourceMappingURL=auth.router.js.map