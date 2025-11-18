// server/src/middleware/asyncHandler.js

/**
 * Higher-order function to wrap async controllers.
 * Catches errors and passes them to the global error handler (errorMiddleware).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;