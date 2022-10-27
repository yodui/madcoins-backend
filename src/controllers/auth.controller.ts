import { UserService, IRegistrationResponse } from '../services/user.service.js';
import { TokenService } from '../services/token.service.js';
import { check, body, query, validationResult } from 'express-validator';
import url from 'url';

import ApiError from '../exceptions/api-error.js';
import UserDto from '../dtos/user.dto.js';

interface IUserListOptions {

}

class AuthController {

    static async registration(req, res, next) {
        try {
            // validate fields
            await AuthController.validateRegistrationData(req, next);
            const {email, password} = req.body;
            const userData = await UserService.registration(email, password);
            // set httpOnly cookie
            res.cookie('refreshToken', userData.refreshToken, {maxAge: TokenService.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000, httpOnly: true});
            return res.json(userData);

        } catch (err) {
            next(err);
        }
    }

    static async removeUser(req, res, next) {
        try {
            const userId = parseInt(req.params.id);
            const result = await UserService.removeUser(userId);
            return res.json({result: result});
        } catch (err) {
            next(err);
        }
    }

    static async validateLoginData(req) {
        await body('email')
            .notEmpty().withMessage('Email is required').bail()
            .isEmail().withMessage('Wrong email syntax').run(req);

        await body('password')
            .notEmpty().withMessage('Password is required').run(req);

        const validationErrors = validationResult(req);
        if(!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('Login validation error', validationErrors.array());
        }
    }

    static async login(req, res, next) {
        try {
            await AuthController.validateLoginData(req);

            const {email, password} = req.body;
            // check exists active user with same email and pass
            const user = await UserService.login(email, password);
            if(false !== user) {

                const userDto = new UserDto(user);

                // generate access and refresh tokens
                const tokens = TokenService.generateTokens(userDto);
                // save refresh token in DB
                TokenService.saveToken(user.userId, tokens.refreshToken);

                res.cookie('refreshToken', tokens.refreshToken, {maxAge: TokenService.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000, httpOnly: true});

                return res.json({'result':'ok', 'user': userDto, ...tokens});
            } else {
                return next(ApiError.BadRequest('Login error', ['Login and\/or password validation error']));
            }
        } catch(err) {
            next(err);
        }
    }

    static async logout(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            // delete refreshToken from db
            const token = await UserService.logout(refreshToken);
            // remove token from cookies
            res.clearCookie('refreshToken');
            return res.json(token);
        } catch(err) {
            next(err);
        }
    }

    static async createRefreshToken(req, res, next) {
        try {

        } catch(err) {
            next(err);
        }
    }

    static async activate(req, res, next) {
        try {
            const activationLink = req.params.link;
            const activationResult = await UserService.activateUser(activationLink);
            if(false === activationResult) {
                // can't find user by activation link
                throw new Error('Can\'t find user by activation link')
            }
            const userDto = new UserDto(activationResult);
            res.status(200).json({result: 'ok', user: userDto});
        } catch(err) {
            next(err);
        }
    }

    static async getUsers(req, res, next) {
        try {
            // validate params
            await AuthController.validateUserListOptionsData(req);
            // default values
            let [limit,offset] = [20,0];
            const query = url.parse(req.url, true).query;
            // check
            if(typeof query.limit === 'string') limit = Number.parseInt(query.limit);
            if(typeof query.offset === 'string') offset = Number.parseInt(query.offset);

            const users = await UserService.getUsers({limit: limit, offset: offset});
            res.status(200).json(users);
        } catch(err) {
            next(err);
        }
    }

    static async validateUserListOptionsData(req) {
        await query('limit').optional()
            .isNumeric().withMessage('Limit must be numeric parameter').bail()
            .isInt({ min:1, max:100 }).withMessage('Limit must be in range 1-100').run(req);

        await query('offset').optional()
            .isNumeric().withMessage('Offset must be numeric parameter').bail()
            .isInt({ min:0 }).withMessage('Offset must be more than 0').run(req);

        const validationErrors = validationResult(req);
        if(!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('User list parameters validation error', validationErrors.array());
        }
    }

    static async validateRegistrationData(req, next) {

        const commonPasswords = ['qwe','123'];

        await body('email')
            .normalizeEmail()
            .notEmpty().withMessage('Email is required').bail()
            .isEmail().withMessage('Wrong email syntax').run(req);

        await body('password')
            .notEmpty().withMessage('Password is required').bail()
            .custom(v => !commonPasswords.includes(v)).withMessage('Don\'t use simply or common passwords').bail()
            .isLength({min:4, max:32}).withMessage('Must be at 4 - 32 chars long')
            .matches(/\d/).withMessage('Password must contain a number')
            .matches(/[a-z]/).withMessage('Passwod must contain a character').run(req);

        const validationErrors = validationResult(req);
        if(!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('Register validation error', validationErrors.array());
        }

    }

}

export { IUserListOptions, AuthController };
