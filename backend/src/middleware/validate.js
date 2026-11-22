/**
 * Parses and replaces req.body with validated data. Zod throws detailed
 * issues which are returned to the client in a predictable shape.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Please check the highlighted fields.',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      })),
    });
  }

  req.body = result.data;
  return next();
};

module.exports = validate;
