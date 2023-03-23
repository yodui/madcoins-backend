import bcrypt from 'bcrypt';
import { v4 as getActivationLink } from 'uuid';

import { pool as db } from '../db/db.js';
import { IUser } from '../classes/Interfaces.js';
import UserDto from '../dtos/user.dto.js';
import Invite from '../classes/auth/Invite';

import { ApiError } from '../exceptions/api-error.js';

import { MailService } from '../services/mail.service.js';
import { TokenService, ITokensPair } from '../services/token.service.js';
import {IUserListOptions} from "../controllers/auth.controller.js";

interface IRegistrationResponse extends ITokensPair {
    user: UserDto
}

class UserService {

    private static SALT = 8;

    static SQL_GET_USERS = 'SELECT * FROM users ORDER BY userId DESC';

    static SQL_GET_USER_BY_EMAIL = `SELECT * FROM users WHERE email = $1`;

    static SQL_GET_USER_PASS_BY_USER_ID = 'SELECT password FROM users WHERE userId = $1';

    static SQL_GET_ACTIVE_USER_BY_ID = 'SELECT * FROM users WHERE userId = $1 AND active = 1';

    static SQL_INSERT_NEW_USER = 'INSERT INTO users (email, password, active, activationLink) VALUES ($1, $2, $3, $4) RETURNING userId, email, active, activationLink';

    static SQL_REMOVE_ALL_UNACTIVE_USERS_BY_EMAIL = 'DELETE FROM users WHERE email = $1 AND active = 0';

    static SQL_UNBIND_INVITES_FOR_UNACTIVE_USERS_BY_EMAIL = 'UPDATE invites SET userId = NULL, activated = 0, activatedDate = NULL WHERE userId IN (SELECT userId FROM users WHERE users.active = 0 AND users.email = $1)';

    static SQL_GET_USER_BY_ACTIVATION_LINK = 'SELECT * FROM users WHERE activationLink = $1';

    static SQL_ACTIVATE_USER_BY_ID = 'UPDATE users SET active = 1 WHERE userId = $1 RETURNING userId, email, active, activationLink, registerdate';

    static SQL_FIND_ACTIVE_USER_BY_EMAIL_AND_PASSWORD = 'SELECT * FROM users WHERE active = 1 AND email = $1 AND password = $2';

    static SQL_REMOVE_USER_BY_ID = 'DELETE FROM users WHERE userId = $1';

    static SQL_GET_COUNT_USERS = 'SELECT users AS cnt FROM stats WHERE type = 0';

    static SQL_GET_INVITE_BY_CODE = 'SELECT i.inviteId, i.code, i.userId, i.activated, i.activateddate FROM invites AS i WHERE i.code = $1';

    static SQL_BIND_INVITE_TO_USER = 'UPDATE invites SET activated = 1, activatedDate = NOW(), userId = $2 WHERE inviteId = $1';

    static SQL_UNBIND_INVITE = 'UPDATE invites SET activated = 0, activatedDate = NULL, userId = NULL WHERE inviteId = $1 AND userId = $2';


    static async findInviteByCode(inviteCode: string) {
        const result = await db.query(this.SQL_GET_INVITE_BY_CODE, [inviteCode]);
        if(result.rows.length) {
            return result.rows[0];
        }
        return false;
    }

    static async getUsers(options: IUserListOptions) {
        const users = {
            count: await UserService.countUsers(),
            rows: []
        }
        console.log('getUsers', options);

        const passFieldName = 'password';
        const result = await db.query(this.SQL_GET_USERS);
        result.rows.forEach(row => {
            // filter password
            if(row.hasOwnProperty(passFieldName)) {
                delete row[passFieldName];
            }
            users.rows.push(this.mapFieldsToProps(row))
        })
        return users;
    }

    static async countUsers() {
        const result = await db.query(this.SQL_GET_COUNT_USERS);
        let totalUsers = 0;
        if(result.rows.length) {
            totalUsers = result.rows[0].cnt;
        }
        return totalUsers
    }

    static async removeUser(userId: number): Promise<boolean> {
        const result = await db.query(this.SQL_REMOVE_USER_BY_ID, [userId]);
        if(!result.rowCount) {
            return false;
        }
        return true;
    }

    static async findUserByActivationLink(activationLink: string): Promise<IUser|false> {
        const result = await db.query(this.SQL_GET_USER_BY_ACTIVATION_LINK, [activationLink]);
        if(result.rows.length) {
            return this.mapFieldsToProps(result.rows[0]);
        }
        return false;
    }

    static async refresh(refreshToken: string) {

        if(!refreshToken) {
            throw ApiError.UnauthorizedError('Refresh token error. User is unauthorized');
        }

        // validate token
        const userDto = await TokenService.validateRefreshToken(refreshToken);
        if(!userDto) {
            throw ApiError.UnauthorizedError('Refresh token validation error. User is unauthorized');
        }

        // check exists token in DB
        const isRefreshTokenExists = await TokenService.existsRefreshToken(refreshToken);
        if(!isRefreshTokenExists) {
            throw ApiError.UnauthorizedError('Refresh token is not exists. User is unauthorized');
        }

        // try to find user by userData in db
        const user = await this.findActiveUserById(userDto.userId);
        if(!user) {
            throw ApiError.UnauthorizedError('Can\'t find user by ID. User is unauthorized');
        }
        const tokens = this.generateTokens(user);

        return {...tokens, user: userDto}
    }

    static async login(email: string, password: string): Promise<IUser|false> {
        // get user by email
        const activeUserByEmail = await this.findUserByEmail(email, 1);
        if(null === activeUserByEmail) {
            // can't find active user by email
            throw ApiError.FormError([{field:'email', errors: [`Can't find user`]}]);
        }
        const hashPassword = await this.getPassByUserId(activeUserByEmail.userId);
        if(true === await bcrypt.compare(password, hashPassword)) {
            // success
            return activeUserByEmail;
        } else {
            // error, password is not valid
            throw ApiError.FormError([{field:'password', errors:[`Password is not valid`]}]);
        }
    }

    static async logout(refreshToken) {
        return await TokenService.removeToken(refreshToken);
    }

    static async getPassByUserId(userId: number): Promise<string|boolean> {
        const result = await db.query(this.SQL_GET_USER_PASS_BY_USER_ID, [userId]);
        if(result.rowCount) {
            return result.rows[0].password;
        }
        return false;
    }

    static async activateUser(activationLink: string): Promise<IUser|false> {
        const user = await this.findUserByActivationLink(activationLink);
        if(user !== false) {
            if(user.active) {
                throw ApiError.LogicError('User is already active');
            }
            // activate user by id
            return await this.activateUserById(user.userId);
        }
        return false;
    }

    static async activateUserById(userId: number): Promise<IUser|false> {
        const result = await db.query(this.SQL_ACTIVATE_USER_BY_ID, [userId]);
        if(result.rows.length) {
            return this.mapFieldsToProps(result.rows[0])
        }
        return false;
    }

    private static mapFieldsToProps(row): IUser {
        return {
            userId: row.userid,
            email: row.email,
            active: row.active,
            password: row.password,
            tsDateReg: row.registerdate,
            tsDateLastVisit: row.lastvisitdate,
            activationLink: row.activationlink
        }
    }

    static async bindInvite(inviteId: number, userId: number): Promise<boolean> {
        const result = await db.query(this.SQL_BIND_INVITE_TO_USER, [inviteId, userId]);
        if (result !== null) {
            return true;
        }
        return false;
    }

    static async registration(email: string, password: string): Promise<IRegistrationResponse> {

        if(null !== await this.findUserByEmail(email, 1)) {
            // active user with email is already exists
            throw ApiError.FormError([{field: 'email', errors: [`User with this email already exists`] }]);
        }

        // unbind invites for unactive users with current email
        await this.unbindInvitesForUnactiveUsers(email);

        // clear all unactive users with same email
        await this.clearUnactiveUsersByEmail(email);

        // check exists password
        if(password === undefined || !password) {
            throw ApiError.FormError([{field: 'password', errors: ['Password requires for registration'] }]);
        }
        const hashPassword = await bcrypt.hash(password, this.SALT);
        const activationLink = getActivationLink(); // ex.: 99770c6c-d8e8-4782-ac86-25f7fd32ccdf
        const defaultActive = 0;

        const user = await this.insertUser(email, hashPassword, defaultActive, activationLink);

        if(false !== user) {

            const fullLink = `${process.env.API_URL}/api/activate/${activationLink}`;
            await MailService.sendActivationMail(email, fullLink);

            return this.generateTokens(user);

        } else {
            throw ApiError.BadRequest('Registration error');
        }
    }

    static generateTokens(user: IUser) {

        // create Data Transfer Object from user
        const userDto = new UserDto(user);

        const tokens = TokenService.generateTokens(userDto);
        // save refresh token in DB
        TokenService.saveToken(user.userId, tokens.refreshToken);

        return {...tokens, user: userDto};
    }

    static async clearUnactiveUsersByEmail(email: string): Promise<boolean> {
        const result = await db.query(this.SQL_REMOVE_ALL_UNACTIVE_USERS_BY_EMAIL, [email]);
        return true;
    }

    static async unbindInvitesForUnactiveUsers(email: string): Promise<boolean> {
        const result = await db.query(this.SQL_UNBIND_INVITES_FOR_UNACTIVE_USERS_BY_EMAIL, [email]);
        if(result !== null) {
            return true;
        }
        return false;
    }

    static async findUserByEmail(email: string, active?: number): Promise<null | IUser> {

        const sqlLimit = ' LIMIT 1';
        let sqlActiveCondition = '';
        if(active !== undefined && [0,1].includes(active)) {
            sqlActiveCondition = ' AND active = ' + active;
        }

        const sql = this.SQL_GET_USER_BY_EMAIL + sqlActiveCondition + sqlLimit;

        const result = await db.query(sql, [email]);
        let user:IUser = null;
        if(result.rows.length) {
            if(result.rows.length) {
                const row = result.rows[0];
                user = this.mapFieldsToProps(row);
            }
        }
        return user;
    }

    static async findActiveUserById(userId: number): Promise<IUser | false> {
        const result = await db.query(this.SQL_GET_ACTIVE_USER_BY_ID, [userId]);
        if(result.rows.length) {
            const row = result.rows[0];
            return this.mapFieldsToProps(row);
        }
        return false;
    }

    static async insertUser(email:string, hashPassword:string, active:number, activationLink:string): Promise<false | IUser> {
        const result = await db.query(this.SQL_INSERT_NEW_USER, [email, hashPassword, active, activationLink]);
        if(result.rows.length) {
            const data = result.rows[0];
            // mapping
            const User: IUser = {
                userId: data.userid,
                email: data.email,
                active: data.active,
                activationLink: data.activationlink
            };
            return User;
        }
        return false;
    }

}

export { IRegistrationResponse, UserService };
