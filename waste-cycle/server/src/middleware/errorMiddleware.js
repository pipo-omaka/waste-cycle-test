const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Check for specific Firebase errors
  if (err.code === 'auth/id-token-expired') {
    statusCode = 401;
    message = 'Token expired, please log in again.';
  }
  if (err.code === 'auth/id-token-revoked') {
    statusCode = 401;
    message = 'Token has been revoked.';
  }

  // Handle Firestore not found errors
  if (err.code === 5) { // 5 = NOT_FOUND in gRPC
    statusCode = 404;
    message = 'Resource not found.';
  }

  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

export { notFound, errorHandler };