import jwt from 'jsonwebtoken';
import UserDto from '../dtos/user.dto.js';
import { pool as db } from '../db/db.js';

interface ITokensPair {
    accessToken: string,
    refreshToken: string
}

class TokenService {

    static SQL_FIND_REFRESH_TOKEN_BY_USER_ID = 'SELECT * FROM tokens WHERE userId = $1';

    static SQL_FIND_REFRESH_TOKEN_BY_TOKEN = 'SELECT * FROM tokens WHERE refreshToken = $1';

    static SQL_UPDATE_REFRESH_TOKEN = 'UPDATE tokens SET refreshToken = $1 WHERE userId = $2';

    static SQL_REMOVE_REFRESH_TOKEN = 'DELETE FROM tokens WHERE refreshToken = $1';

    static SQL_INSERT_REFRESH_TOKEN = 'INSERT INTO tokens (userId, refreshToken) VALUES ($1, $2)';

    public static refreshTokenExpiresInDays: number = 45;
    public static accessTokenExpiresInMinutes: number = 15;

    static generateTokens(user: UserDto): ITokensPair {
        const accessToken = jwt.sign({...user}, process.env.JWT_ACCESS_SECRET_KEY, { expiresIn: this.accessTokenExpiresInMinutes+'m' });
        const refreshToken = jwt.sign({...user}, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: this.refreshTokenExpiresInDays+'d' });
        return {
            accessToken,
            refreshToken
        }
    }

    static async removeToken(refreshToken) {
        const result = await db.query(this.SQL_REMOVE_REFRESH_TOKEN, [refreshToken]);
        if(result.rowCount) {
            return {removed: true, token: refreshToken}
        }
        return {removed: false, token: refreshToken}
    }

    static async validateAccessToken(accessToken): Promise<UserDto|null> {
        try {
            const userDto = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET_KEY);
            return userDto;
        } catch(err) {
            return null;
        }
    }

    static async validateRefreshToken(refreshToken): Promise<UserDto|null> {
        try {
            const userDto = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
            return userDto;
        } catch(err) {
            return null;
        }
    }

    static async existsRefreshToken(refreshToken: string) {
        const result = await db.query(this.SQL_FIND_REFRESH_TOKEN_BY_TOKEN, [refreshToken]);
        if(result.rows.length) {
            return true;
        }
        return false;
    }

    static async saveToken(userId: number, refreshToken): Promise<void> {
        // check exists refresh token
        const result = await db.query(this.SQL_FIND_REFRESH_TOKEN_BY_USER_ID, [userId]);
        if(result.rows.length) {
            const row = result.rows[0];
            // token is already exists, update refresh token
            const updateTokenResult = await db.query(this.SQL_UPDATE_REFRESH_TOKEN, [refreshToken, userId]);
        } else {
            // insert new token
            const newTokenResult = await db.query(this.SQL_INSERT_REFRESH_TOKEN, [userId, refreshToken]);
        }
    }

}

export { TokenService, ITokensPair };
