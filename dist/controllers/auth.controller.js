import { UserService } from '../services/user.service.js';
import { TokenService } from '../services/token.service.js';
import { body, validationResult } from 'express-validator';
import ApiError from '../exceptions/api-error.js';
import UserDto from '../dtos/user.dto.js';
export default class AuthController {
    static async registration(req, res, next) {
        try {
            await AuthController.validateRegistration(req, next);
            const { email, password } = req.body;
            const userData = await UserService.registration(email, password);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: TokenService.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const loginErrors = validationResult(req);
            if (!loginErrors.isEmpty()) {
                return next(ApiError.BadRequest('Validation error', loginErrors.array()));
            }
            const { email, password } = req.body;
            const user = await UserService.login(email, password);
            if (false !== user) {
                const userDto = new UserDto(user);
                return res.json({ 'result': 'ok', 'user': userDto });
            }
            else {
                return next(ApiError.BadRequest('Login validation error'));
            }
        }
        catch (err) {
            next(err);
        }
    }
    static async logout(req, res, next) {
        try {
        }
        catch (err) {
            next(err);
        }
    }
    static async createRefreshToken(req, res, next) {
        try {
        }
        catch (err) {
            next(err);
        }
    }
    static async activate(req, res, next) {
        try {
            const activationLink = req.params.link;
            const activationResult = await UserService.activateUser(activationLink);
            if (false === activationResult) {
                throw new Error('Can\'t find user by activation link');
            }
            const userDto = new UserDto(activationResult);
            res.status(200).json({ result: 'ok', user: userDto });
        }
        catch (err) {
            next(err);
        }
    }
    static async getTestData(req, res, next) {
        try {
            res.status(200).json(['test1', 123, 'query 345', -2]);
        }
        catch (err) {
            next(err);
        }
    }
    static async validateRegistration(req, next) {
        const commonPasswords = ['qwe', '123'];
        await body('email')
            .normalizeEmail()
            .notEmpty().withMessage('Email is required').bail()
            .isEmail().withMessage('Wrong email syntax').run(req);
        await body('password')
            .notEmpty().withMessage('Password is required').bail()
            .custom(v => !commonPasswords.includes(v)).withMessage('Don\'t use simply or common passwords').bail()
            .isLength({ min: 4, max: 32 }).withMessage('Must be at 4 - 32 chars long')
            .matches(/\d/).withMessage('Password must contain a number')
            .matches(/[a-z]/).withMessage('Passwor must contain a character').run(req);
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('Register validation error', validationErrors.array());
        }
    }
}
//# sourceMappingURL=auth.controller.js.map