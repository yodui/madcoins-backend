import bcrypt from 'bcrypt';
import { v4 as getActivationLink } from 'uuid';

import { pool as db } from '../db/db.js';
import { IUser } from '../classes/Interfaces.js';
import UserDto from '../dtos/user.dto.js';

import ApiError from '../exceptions/api-error.js';

import { MailService } from '../services/mail.service.js';
import { TokenService, ITokensPair } from '../services/token.service.js';
import {IUserListOptions} from "../controllers/auth.controller.js";

interface IRegistrationResponse extends ITokensPair {
    user: UserDto
}

class UserService {

    private static SALT = 8;

    static SQL_GET_USERS = 'SELECT * FROM users ORDER BY userId DESC';

    static SQL_GET_ACTIVE_USER_BY_EMAIL = 'SELECT * FROM users WHERE email = $1 AND active = 1';

    static SQL_GET_USER_PASS_BY_USER_ID = 'SELECT password FROM users WHERE userId = $1';

    static SQL_INSERT_NEW_USER = 'INSERT INTO users (email, password, active, activationLink) VALUES ($1, $2, $3, $4) RETURNING userId, email, active, activationLink';

    static SQL_REMOVE_ALL_UNACTIVE_USERS_BY_EMAIL = 'DELETE FROM users WHERE email = $1 AND active = 0';

    static SQL_GET_USER_BY_ACTIVATION_LINK = 'SELECT * FROM users WHERE activationLink = $1';

    static SQL_ACTIVATE_USER_BY_ID = 'UPDATE users SET active = 1 WHERE userId = $1 RETURNING userId, email, active, activationLink, registerdate';

    static SQL_FIND_ACTIVE_USER_BY_EMAIL_AND_PASSWORD = 'SELECT * FROM users WHERE active = 1 AND email = $1 AND password = $2';

    static SQL_REMOVE_USER_BY_ID = 'DELETE FROM users WHERE userId = $1';

    static SQL_GET_COUNT_USERS = 'SELECT users AS cnt FROM stats WHERE type = 0';

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

    static async findUserByActivationLink(activationLink:string): Promise<IUser|false> {
        const result = await db.query(this.SQL_GET_USER_BY_ACTIVATION_LINK, [activationLink]);
        if(result.rows.length) {
            return this.mapFieldsToProps(result.rows[0]);
        }
        return false;
    }

    static async login(email: string, password: string): Promise<IUser|false> {
        // get user by email
        const usersByEmail = await this.findActiveUserByEmail(email);
        if(false === usersByEmail) {
            // can't find active user by email
            throw ApiError.BadRequest(`Can't find active user by email ${email}`);
        }
        const user = usersByEmail[0];
        const hashPassword = await this.getPassByUserId(user.userId);
        if(true === await bcrypt.compare(password, hashPassword)) {
            // success
            return user;
        } else {
            // error, password is not valid
            throw ApiError.BadRequest(`Password is not valid for user ${email}`);
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

    static async registration(email:string, password:string): Promise<IRegistrationResponse> {

        if(false !== await this.findActiveUserByEmail(email)) {
            // active user with email is already exists
            throw ApiError.LogicError(`User with email ${email} already exists`);
        }

        // clear all unactive users with same email
        await this.clearUnactiveUsersByEmail(email);

        // check exists password
        if(password === undefined || !password) {
            throw ApiError.LogicError('Password requires for registration');
        }
        const hashPassword = await bcrypt.hash(password, this.SALT);
        const activationLink = getActivationLink(); // ex.: 99770c6c-d8e8-4782-ac86-25f7fd32ccdf
        const defaultActive = 0;

        const user = await this.insertUser(email, hashPassword, defaultActive, activationLink);

        if(false !== user) {

            const fullLink = `${process.env.API_URL}/api/activate/${activationLink}`;
            await MailService.sendActivationMail(email, fullLink);

            // create Data Transfer Object from user
            const userDto = new UserDto(user);

            const tokens = TokenService.generateTokens(userDto);
            // save refresh token in DB
            TokenService.saveToken(user.userId, tokens.refreshToken);

            return {...tokens, user: userDto};

        } else {
            throw ApiError.BadRequest('Registration error');
        }
    }

    static async clearUnactiveUsersByEmail(email:string): Promise<boolean> {
        const result = await db.query(this.SQL_REMOVE_ALL_UNACTIVE_USERS_BY_EMAIL, [email]);
        return true;
    }

    static async findActiveUserByEmail(email:string): Promise<boolean | IUser[]> {
        const result = await db.query(this.SQL_GET_ACTIVE_USER_BY_EMAIL, [email]);
        if(result.rows.length) {
            const users:IUser[] = [];
            for(let index in result.rows) {
                const row = result.rows[index];
                const dateCreate = new Date(row.registerdate);
                // mapping
                users.push(this.mapFieldsToProps(row));
            }
            return users;
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
