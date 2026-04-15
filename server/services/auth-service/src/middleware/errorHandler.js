function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const code = err.code || (status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR");
  const message = err.message || "Something went wrong";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    error: { code, message, details: err.details ?? undefined },
  });
}

module.exports = { errorHandler };
