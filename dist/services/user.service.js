import bcrypt from 'bcrypt';
import { v4 as getActivationLink } from 'uuid';
import { pool as db } from '../db/db.js';
import UserDto from '../dtos/user.dto.js';
import ApiError from '../exceptions/api-error.js';
import { MailService } from '../services/mail.service.js';
import { TokenService } from '../services/token.service.js';
class UserService {
    static SALT = 8;
    static SQL_GET_ACTIVE_USER_BY_EMAIL = 'SELECT * FROM users WHERE email = $1 AND active = 1';
    static SQL_GET_USER_PASS_BY_USER_ID = 'SELECT password FROM users WHERE userId = $1';
    static SQL_INSERT_NEW_USER = 'INSERT INTO users (email, password, active, activationLink) VALUES ($1, $2, $3, $4) RETURNING userId, email, active, activationLink';
    static SQL_REMOVE_ALL_UNACTIVE_USERS_BY_EMAIL = 'DELETE FROM users WHERE email = $1 AND active = 0';
    static SQL_GET_USER_BY_ACTIVATION_LINK = 'SELECT * FROM users WHERE activationLink = $1';
    static SQL_ACTIVATE_USER_BY_ID = 'UPDATE users SET active = 1 WHERE userId = $1 RETURNING userId, email, active, activationLink, registerdate';
    static SQL_FIND_ACTIVE_USER_BY_EMAIL_AND_PASSWORD = 'SELECT * FROM users WHERE active = 1 AND email = $1 AND password = $2';
    static async findUserByActivationLink(activationLink) {
        const result = await db.query(this.SQL_GET_USER_BY_ACTIVATION_LINK, [activationLink]);
        if (result.rows.length) {
            return this.mapFieldsToProps(result.rows[0]);
        }
        return false;
    }
    static async login(email, password) {
        const usersByEmail = await this.findActiveUserByEmail(email);
        if (false === usersByEmail) {
            return false;
        }
        const user = usersByEmail[0];
        const hashPassword = await this.getPassByUserId(user.userId);
        if (true === await bcrypt.compare(password, hashPassword)) {
            return this.mapFieldsToProps(user);
        }
        return false;
    }
    static async getPassByUserId(userId) {
        const result = await db.query(this.SQL_GET_USER_PASS_BY_USER_ID, [userId]);
        if (result.rowCount) {
            return result.rows[0].password;
        }
        return false;
    }
    static async activateUser(activationLink) {
        const user = await this.findUserByActivationLink(activationLink);
        if (user !== false) {
            if (user.active) {
                throw ApiError.LogicError('User is already active');
            }
            return await this.activateUserById(user.userId);
        }
        return false;
    }
    static async activateUserById(userId) {
        const result = await db.query(this.SQL_ACTIVATE_USER_BY_ID, [userId]);
        if (result.rows.length) {
            return this.mapFieldsToProps(result.rows[0]);
        }
        return false;
    }
    static mapFieldsToProps(row) {
        return {
            userId: row.userid,
            email: row.email,
            active: row.active,
            password: row.password,
            tsDateReg: row.registerdate,
            tsDateLastVisit: row.lastvisitdate,
            activationLink: row.activationlink
        };
    }
    static async registration(email, password) {
        if (false !== await this.findActiveUserByEmail(email)) {
            throw ApiError.LogicError(`User with email ${email} already exists`);
        }
        await this.clearUnactiveUsersByEmail(email);
        if (password === undefined || !password) {
            throw ApiError.LogicError('Password requires for registration');
        }
        const hashPassword = await bcrypt.hash(password, this.SALT);
        const activationLink = getActivationLink();
        const defaultActive = 0;
        const user = await this.insertUser(email, hashPassword, defaultActive, activationLink);
        if (false !== user) {
            const fullLink = `${process.env.API_URL}/api/activate/${activationLink}`;
            await MailService.sendActivationMail(email, fullLink);
            const userDto = new UserDto(user);
            const tokens = TokenService.generateTokens(userDto);
            TokenService.saveToken(user.userId, tokens.refreshToken);
            return { ...tokens, user: userDto };
        }
        else {
            throw ApiError.BadRequest('Registration error');
        }
    }
    static async clearUnactiveUsersByEmail(email) {
        const result = await db.query(this.SQL_REMOVE_ALL_UNACTIVE_USERS_BY_EMAIL, [email]);
        return true;
    }
    static async findActiveUserByEmail(email) {
        const result = await db.query(this.SQL_GET_ACTIVE_USER_BY_EMAIL, [email]);
        if (result.rows.length) {
            const users = [];
            for (let index in result.rows) {
                const row = result.rows[index];
                const dateCreate = new Date(row.registerdate);
                users.push(this.mapFieldsToProps(row));
            }
            return users;
        }
        return false;
    }
    static async insertUser(email, hashPassword, active, activationLink) {
        const result = await db.query(this.SQL_INSERT_NEW_USER, [email, hashPassword, active, activationLink]);
        if (result.rows.length) {
            const data = result.rows[0];
            const User = {
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
export { UserService };
//# sourceMappingURL=user.service.js.map