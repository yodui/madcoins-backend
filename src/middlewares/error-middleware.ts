import ApiError from '../exceptions/api-error.js';

export default (err, req, res, next) => {

    if(err instanceof ApiError) {
        return res.status(err.status).json({
            message: err.message,
            errors: err.errors
        });
    }

    return res.status(500).json({message:'Unknown error'});
}
