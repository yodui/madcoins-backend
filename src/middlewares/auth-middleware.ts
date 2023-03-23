import { ApiError } from '../exceptions/api-error.js';
import { TokenService } from '../services/token.service.js';

export default async (req, res, next) => {
    try {
        // get token header from http headers
        const authorizationHeader = req.headers.authorization;
        if(!authorizationHeader) {
            return next(ApiError.UnauthorizedError());
        }
        // get token from header
        const accessToken = authorizationHeader.split(' ')[1];
        if(!accessToken) {
            return next(ApiError.UnauthorizedError());
        }
        // validate token
        const userData = await TokenService.validateAccessToken(accessToken);
        if(!userData) {
            return next(ApiError.UnauthorizedError());
        }
        // save user in request
        req.user = userData;
        next();
    } catch(err) {
        return next(ApiError.UnauthorizedError());
    }
}
