import bcrypt from 'bcrypt';
import { v4 as getActivationLink } from 'uuid';

import { pool as db } from '../db/db.js';
import { IUser } from '../classes/Interfaces.js';
import UserDto from '../dtos/user.dto.js';

import MailService from '../services/mail.service.js';
import TokenService from '../services/token.service.js';


export default class UserService {

    private static SALT = 8;

    static SQL_GET_ACTIVE_USER_BY_EMAIL = 'SELECT * FROM users WHERE email = $1 AND active = 1';

    static SQL_INSERT_NEW_USER = 'INSERT INTO users (email, password, active, activationLink) VALUES ($1, $2, $3, $4) RETURNING userId, email, active, activationLink';

    static SQL_REMOVE_ALL_UNACTIVE_USERS_BY_EMAIL = 'DELETE FROM users WHERE email = $1 AND active = 0';


    static async registration(email:string, password:string) {
        if(false !== await this.findActiveUserByEmail(email)) {
            // active user with email is already exists
            return { error: `User with email ${email} already exists` }
        }
        // clear all unactive users with same email
        await this.clearUnactiveUsersByEmail(email);
        // check exists password
        if(password == undefined) {
            return { error: `Password requires for registration` }
        }
        const hashPassword = await bcrypt.hash(password, this.SALT);
        const activationLink = getActivationLink(); // ex.: 99770c6c-d8e8-4782-ac86-25f7fd32ccdf
        const defaultActive = 0;
        const user = await this.insertUser(email, password, defaultActive, activationLink);
        if(false !== user) {

            await MailService.sendActivationMail(email, activationLink);

            const jwtPayload = { userId: user.userId, email: user.email };

            const userDto = new UserDto(user);

            const tokens = TokenService.generateTokens(userDto);
            // save refresh token in DB
            console.log('save token...');
            TokenService.saveToken(user.userId, tokens.refreshToken);

            return {...tokens, user: userDto};
        } else {
            return { error: `Registration error` }
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
                users.push({
                    userId: row.userid,
                    email: row.email,
                    active: row.active,
                    tsDateReg: BigInt(dateCreate.getTime()),
                    activationLink: row.activationlink
                });
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
