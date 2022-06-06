import { UserService } from '../services/user.service.js';
import { TokenService } from '../services/token.service.js';
export default class AuthController {
    static async registration(req, res, next) {
        try {
            const { email, password } = req.body;
            const userData = await UserService.registration(email, password);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: TokenService.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        }
        catch (err) {
            res.json({ error: err.message });
        }
    }
    static async login(req, res, next) {
        try {
        }
        catch (err) {
            console.log(err);
        }
    }
    static async logout(req, res, next) {
        try {
        }
        catch (err) {
            console.log(err);
        }
    }
    static async createRefreshToken(req, res, next) {
        try {
        }
        catch (err) {
            console.log(err);
        }
    }
    static async activate(req, res, next) {
        try {
        }
        catch (err) {
            console.log(err);
        }
    }
    static async getTestData(req, res, next) {
        try {
            res.status(200).json(['test1', 123, 'query 345', -2]);
        }
        catch (err) {
            console.log(err);
        }
    }
}
//# sourceMappingURL=auth.controller.js.map