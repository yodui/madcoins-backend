import jwt from 'jsonwebtoken';
import { pool as db } from '../db/db.js';
export default class TokenService {
    static SQL_FIND_REFRESH_TOKEN = 'SELECT * FROM tokens WHERE userId = $1';
    static SQL_UPDATE_REFRESH_TOKEN = 'UPDATE tokens SET tokenId = $1 WHERE userId = $2';
    static SQL_INSERT_REFRESH_TOKEN = 'INSERT INTO tokens (userId, refreshToken) VALUES ($1, $2)';
    static generateTokens(user) {
        const accessToken = jwt.sign({ ...user }, process.env.JWT_ACCESS_KEY, { expiresIn: '60m' });
        const refreshToken = jwt.sign({ ...user }, process.env.JWT_REFRESH_KEY, { expiresIn: '45d' });
        return {
            accessToken,
            refreshToken
        };
    }
    static async saveToken(userId, refreshToken) {
        const result = await db.query(this.SQL_FIND_REFRESH_TOKEN, [userId]);
        console.log(result);
        if (result.rows.length) {
            const row = result.rows[0];
            const updateTokenResult = await db.query(this.SQL_UPDATE_REFRESH_TOKEN, [refreshToken, userId]);
        }
        else {
            console.log('refreshToken length: ', refreshToken.toString().length);
            const newTokenResult = await db.query(this.SQL_INSERT_REFRESH_TOKEN, [userId, refreshToken]);
        }
    }
}
//# sourceMappingURL=token.service.js.map