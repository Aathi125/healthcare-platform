function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`
  });
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isApiError = err.name === "ApiError";

  if (statusCode >= 500) {
    console.error(err);
  }

  const message = isApiError
    ? err.message
    : statusCode === 500
      ? "Internal server error"
      : err.message || "Unexpected error";

  res.status(statusCode).json({ message });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
