export const notFoundHandler = (req, res, next) => {
  res.status(404).json({ error: "Not Found" });
};

export const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({ error: "Internal Server Error" });
};
