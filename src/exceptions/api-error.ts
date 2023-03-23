type FieldError = {
    field: string,
    errors: string[]
}

class ApiError extends Error {

    public status: number;
    public errors;
    public fields: FieldError[];

    constructor(status, message, errors = [], fields = []) {
        super(message);
        this.status = status;
        this.errors = errors;
        this.fields = fields;
    }

    static UnauthorizedError(message: string = 'User is unauthorized'): ApiError {
        // 401 - User is unauthorized
        return new ApiError(401, message);
    }

    static LogicError(message: string, errors = []): ApiError {
        return new ApiError(400, message, errors);
    }

    static SyntaxError(message: string) {
        return new ApiError(400, message);
    }

    static BadRequest(message: string, errors = [], fields = null): ApiError {
        // 400 - Bad request
        return new ApiError(400, message, errors, fields);
    }

    static FormError(errors= []) {
        return new ApiError(400, 'Form validation error', errors, null);
    }

}

export { FieldError, ApiError };
