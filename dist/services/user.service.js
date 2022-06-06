import bcrypt from 'bcrypt';
import { v4 as getActivationLink } from 'uuid';
import { pool as db } from '../db/db.js';
import UserDto from '../dtos/user.dto.js';
import { MailService } from '../services/mail.service.js';
import { TokenService } from '../services/token.service.js';
class UserService {
    static SALT = 8;
    static SQL_GET_ACTIVE_USER_BY_EMAIL = 'SELECT * FROM users WHERE email = $1 AND active = 1';
    static SQL_INSERT_NEW_USER = 'INSERT INTO users (email, password, active, activationLink) VALUES ($1, $2, $3, $4) RETURNING userId, email, active, activationLink';
    static SQL_REMOVE_ALL_UNACTIVE_USERS_BY_EMAIL = 'DELETE FROM users WHERE email = $1 AND active = 0';
    static async registration(email, password) {
        if (false !== await this.findActiveUserByEmail(email)) {
            throw new TypeError(`User with email ${email} already exists`);
        }
        await this.clearUnactiveUsersByEmail(email);
        if (password === undefined || !password) {
            throw new TypeError('Password requires for registration');
        }
        const hashPassword = await bcrypt.hash(password, this.SALT);
        const activationLink = getActivationLink();
        const defaultActive = 0;
        const user = await this.insertUser(email, password, defaultActive, activationLink);
        if (false !== user) {
            const fullLink = `${process.env.API_URL}/api/activate/${activationLink}`;
            console.log('Full link: ', fullLink);
            await MailService.sendActivationMail(email, fullLink);
            const userDto = new UserDto(user);
            const tokens = TokenService.generateTokens(userDto);
            TokenService.saveToken(user.userId, tokens.refreshToken);
            return { ...tokens, user: userDto };
        }
        else {
            throw new TypeError('Registration error');
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