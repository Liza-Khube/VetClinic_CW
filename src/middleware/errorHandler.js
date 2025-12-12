const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ConflictError') {
    return res.status(409).json({ message: err.message });
  }

  if (err.name === 'PermissionDeniedError') {
    return res.status(403).json({ message: err.message });
  }

  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message,
  });
};

export default errorHandler;
