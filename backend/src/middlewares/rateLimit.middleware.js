//rateLimit.middleware.js

const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const { AppError } = require("../libs/errors");
/**
 * =========================
 * Generic rate limiter
 * =========================
 *
 * Usage:
 *   router.use(rateLimitMiddleware())
 *   router.post("/login", rateLimitMiddleware({ max: 10 }))
 */
function rateLimitMiddleware(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 1000, // max requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res, next) => {
      next(
        new AppError(
          options.message || "Too many requests, please try again later",
          429
        )
      );
    },
  });
}

/**
 * =========================
 * OTP-specific limiter
 * =========================
 * Very strict — protects OTP abuse
 *
 * Usage:
 *   router.post("/send-otp", otpRateLimit, controller.sendOtp)
 */
const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    // Use mobile if available, else safe IP key (IPv6-safe)
    const mobile = req.body?.mobile;
    return mobile ? `mobile:${mobile}` : ipKeyGenerator(req);
  },

  handler: (req, res, next) => {
    next(new AppError("Too many OTP requests. Please wait and try again.", 429));
  },
});

/**
 * =========================
 * Login-specific limiter
 * =========================
 */
const loginRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res, next) => {
    next(
      new AppError(
        "Too many login attempts. Please try again later.",
        429
      )
    );
  },
});

module.exports = {
  rateLimitMiddleware,
  otpRateLimit,
  loginRateLimit,
};
