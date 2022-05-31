import UserService from '../services/user.service.js';
export default class AuthController {
    static async registration(req, res, next) {
        try {
            const { email, password } = req.body;
            const userData = await UserService.registration(email, password);
            return res.json(userData);
        }
        catch (err) {
            console.log(err);
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