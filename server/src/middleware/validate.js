const { validationResult } = require('express-validator');

// Runs after express-validator chains and turns failures into one clear message.
module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  res.status(400);
  return next(new Error(result.array().map((e) => e.msg).join(', ')));
};
