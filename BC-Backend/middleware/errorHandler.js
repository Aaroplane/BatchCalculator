// Catches requests that don't match any defined route
const notFound = (req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Global error handler — must have 4 parameters for Express to recognize it
const errorHandler = (err, req, res, next) => {
  console.error(`[${req.method}] ${req.originalUrl} —`, err.message);

  if (err.code === '23505') {
    const detail = err.detail || '';
    const field = detail.match(/\((.+?)\)/)?.[1] || 'value';
    return res.status(409).json({
      error: `A record with that ${field} already exists`,
      message: 'If this is a variant (different origin, grade, or supplier), differentiate it in the name'
    });
  }
  if (err.code === '23503') {
    return res.status(409).json({ error: 'This record is referenced by another record and cannot be modified' });
  }
  if (err.code === '23502') {
    return res.status(400).json({ error: `Missing required field: ${err.column || 'unknown'}` });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message
  });
};

module.exports = { notFound, errorHandler };
