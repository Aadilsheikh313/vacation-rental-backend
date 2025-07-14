class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const errorMiddleware = (err, req, res, next) => {
    
    // Default values for message and status code
    err.message = err.message || "Internal server error";
    err.statusCode = err.statusCode || 500;

    // Handle specific errors
    if (err.name === "CastError") {
        // Handle invalid MongoDB Object IDs
        const message = `Resource not found. Invalid ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    if (err.code === 11000) {
        // Handle duplicate key errors (e.g., duplicate emails)
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400);
    }

    if (err.name === "ValidationError") {
        // Handle mongoose validation errors
        const message = Object.values(err.errors).map(val => val.message).join(", ");
        err = new ErrorHandler(message, 400);
    }

    if (err.name === "JsonWebTokenError") {
        // Handle invalid JWT
        const message = "Invalid JSON Web Token. Please try again.";
        err = new ErrorHandler(message, 400);
    }

    if (err.name === "TokenExpiredError") {
        // Handle expired JWT
        const message = "JSON Web Token has expired. Please log in again.";
        err = new ErrorHandler(message, 400);
    }

    // Return error response
    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};

export default ErrorHandler;