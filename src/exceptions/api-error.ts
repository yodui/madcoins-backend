export default class ApiError extends Error {

    public status:number;
    public errors;

    constructor(status, message, errors = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    static UnauthorizedError(message:string = 'User is unauthorized'): ApiError {
        // 401 - User is unauthorized
        return new ApiError(401, message);
    }

    static LogicError(message:string, errors = []): ApiError {
        return new ApiError(400, message, errors);
    }

    static BadRequest(message:string, errors = []): ApiError {
        // 400 - Bad request
        return new ApiError(400, message, errors);
    }

}
