const handleError = (error, req, res, next) => {
  res.status(500).send({
    error: error.message
  });
};

module.exports = handleError;