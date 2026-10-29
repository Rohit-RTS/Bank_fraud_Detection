// server/middleware/errorHandler.js
// Centralized error handling middleware

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Don't expose internal details
  const isDev = process.env.NODE_ENV === 'development';

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'Duplicate entry: this record already exists.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
