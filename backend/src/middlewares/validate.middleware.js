// const { AppError } = require("../libs/errors");

// module.exports = (schema) => (req, res, next) => {
//   const parsed = schema.safeParse(req.body);
//   if (!parsed.success) {
//     return next(new AppError(parsed.error.errors[0].message, 422));
//   }
//   req.body = parsed.data;
//   next();
// };
// src/middlewares/validate.middleware.js
const { ZodError } = require("zod");

module.exports = (schema) => (req, res, next) => {
  try {
    // parse + also apply defaults/transforms
    const parsed = schema.parse(req.body);

    // replace body with validated data
    req.body = parsed;
    next();
  } catch (err) {
    // Zod validation error
    if (err instanceof ZodError) {
      const first = err.issues?.[0];

      return res.status(400).json({
        ok: false,
        error: first?.message || "Validation failed",
        field: first?.path?.join(".") || undefined,
      });
    }

    // other errors
    return res.status(400).json({
      ok: false,
      error: err?.message || "Validation failed",
    });
  }
};
