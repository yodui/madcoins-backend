import { UserService, IRegistrationResponse } from '../services/user.service.js';
import { TokenService } from '../services/token.service.js';
import { check, body, query, validationResult } from 'express-validator';
import Invite from '../classes/auth/Invite.js';
import url from 'url';

import { ApiError } from '../exceptions/api-error.js';
import UserDto from '../dtos/user.dto.js';

interface IUserListOptions {
}

const REFRESH_TOKEN = 'refreshToken';

class AuthController {

    static async testData(req, res, next) {
        try {
            console.log('testData...', req.body);
            res.cookie('test231', 81, { maxAge: TokenService.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000, httpOnly: true});
            return res.json({response: 'test'})
        } catch (err) {
            next(err);
        }
    }

    static async signUp(req, res, next) {
        try {
            // validate fields
            await AuthController.validateRegistrationData(req, next);

            const {email, password, invite} = req.body;

            // create invite instance
            const inviteObject = new Invite(invite);

            if(inviteObject.isInvalid) {
                throw ApiError.FormError([{field: 'invite', errors:['Invite syntax error']}]);
            }

            if(await inviteObject.isExists() === false) {
                throw ApiError.FormError([{field: 'invite', errors:['Invite code is not exists']}]);
            }

            if(await inviteObject.isAvailable() === false) {
                // invite is binded to user, check user active
                if(await inviteObject.isBindedUserActive() === true) {
                    throw ApiError.FormError([{field: 'invite', errors:['Invite code is not available']}]);
                }
            }

            const userDto = await UserService.registration(email, password);

            // bind invite to user
            const bindingResult = await inviteObject.bind(userDto.userId);
            if(bindingResult === false) {
                throw ApiError.BadRequest('Invite binding exception', [{field: 'invite', errors:['Invite binding exception']}]);
            }

            return res.json(userDto);

        } catch (err) {
            next(err);
        }
    }

    static async userExists(req, res, next) {
        try {
            // validate
            await AuthController.validateEmailExists(req);

            const {email} = req.body;
            const user = await UserService.findUserByEmail(email);

            if(user === null) {
                // not find active user by email
                return res.json({ userExists: false, active: null });
            }

            return res.json({ userExists: true, active: user.active });

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

    static async validateEmailExists(req) {
        await body('email')
            .notEmpty().withMessage('Email is empty').bail()
            .isEmail().withMessage('Wrong email syntax').run(req);

        const validationErrors = validationResult(req);
        const responseDto = this.mapValidationToResponse(validationErrors);

        if(!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('Exmail exist error', responseDto);
        }
    }

    static async validateLoginData(req) {
        await body('email')
            .notEmpty().withMessage('Email is required').bail()
            .isEmail().withMessage('Wrong email syntax').run(req);

        await body('password')
            .notEmpty().withMessage('Password is required').run(req);

        const validationErrors = validationResult(req);
        const responseDto = this.mapValidationToResponse(validationErrors);

        if(!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('Login validation error', responseDto);
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

                res.header('Access-Control-Allow-Headers', '*');
                res.header('Access-Control-Allow-Origin', req.headers.origin);
                res.header('Access-Control-Allow-Credentials', true);
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

                // generate access and refresh tokens
                const tokens = TokenService.generateTokens(userDto);
                // save refresh token in DB
                TokenService.saveToken(user.userId, tokens.refreshToken);

                res.cookie('refreshToken', tokens.refreshToken, {path: '/', maxAge: TokenService.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000, httpOnly: true});

                return res.json({'result':true, 'user': userDto, ...tokens});

            } else {
                return next(ApiError.BadRequest('Login error', [{field:'password', errors:['Error']}]));
            }
        } catch(err) {
            next(err);
        }
    }

    static async logout(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            // delete refresh token from db
            const token = await UserService.logout(refreshToken);
            // remove refresh token from cookies
            res.clearCookie(REFRESH_TOKEN, { path: '/' });
            return res.json({result: true});
        } catch(err) {
            next(err);
        }
    }

    static async refreshToken(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const response = await UserService.refreshToken(refreshToken);
            res.cookie(REFRESH_TOKEN, response.refreshToken, {maxAge: TokenService.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000, httpOnly: true});
            return res.json(response);
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

        const responseDto = this.mapValidationToResponse(validationErrors);

        if(!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('User list parameters validation error', responseDto);
        }
    }

    static async validateRegistrationData(req, next) {

        const commonPasswords = ['qwe','123','1234','qweasd','qwerty','asdzxc','test123','test'];

        await body('email')
            .normalizeEmail()
            .notEmpty().withMessage('Email is required').bail()
            .isEmail().withMessage('Wrong email syntax').run(req);

        await body('invite')
            .notEmpty().withMessage('Invite code is required').run(req);

        await body('password')
            .notEmpty().withMessage('Password is required').bail()
            .custom(v => !commonPasswords.includes(v)).withMessage('Don\'t use simply or common passwords').bail()
            .isLength({min:7, max:32}).withMessage('Must be at 7 - 32 chars long')
            .matches(/\d/).withMessage('Password must contain a number')
            .matches(/[a-z]/).withMessage('Passwod must contain a character').run(req);

        const validationErrors = validationResult(req);

        const responseDto = this.mapValidationToResponse(validationErrors);

        if(!validationErrors.isEmpty()) {
            throw ApiError.BadRequest('Register validation error', responseDto);
        }

    }

    static mapValidationToResponse(validationErrors) {
        const fields = {};
        if(validationErrors.hasOwnProperty('errors')) {
            for(const k in validationErrors.errors) {
                const item = validationErrors.errors[k];
                // field name
                let param;
                if(item.hasOwnProperty('param')) {
                    param = item.param;
                }
                // value
                let value;
                if(item.hasOwnProperty('value')) {
                    value = item.value;
                }
                // msg
                let msg;
                if(item.hasOwnProperty('msg')) {
                    msg = item.msg;
                }
                if(!fields.hasOwnProperty(param)) {
                    // append new field
                    fields[param] = [];
                }
                fields[param].push(msg);
            }
        }
        const response = [];
        for(let param in fields) {
            response.push({field: param, errors: fields[param]});
        }
        return response;
    }

}

export { IUserListOptions, AuthController };
