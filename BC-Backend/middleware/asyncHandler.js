// Wraps async controller functions so unhandled promise rejections
// are forwarded to the global error handler via next(err)
// Controllers with explicit try/catch still work — this is a safety net
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
