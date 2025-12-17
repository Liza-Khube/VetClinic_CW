const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'A record with this data already exists',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      message: 'Record not found',
    });
  }

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
