//auth.validation.js
const { z } = require("zod");

/**
 * Common helpers
 */
const mobileSchema = z
  .number()
  .int()
  .min(1000000000, "mobile must be at least 10 digits")
  .max(999999999999999, "mobile is too long");

const otpSchema = z
  .string()
  .trim()
  .min(4, "otp must be at least 4 digits")
  .max(8, "otp is too long");

const idSchema = z.number().int().positive();

/**
 * =========================
 * OTP FLOW
 * =========================
 */

/**
 * POST /api/auth/send-otp
 * body: { mobile, mode?, userId?, ulbId? }
 */
const sendOtpSchema = z.object({
  mobile: mobileSchema,
  mode: z.number().int().optional(),     // e.g. 1 = send
  userId: z.string().trim().min(1, "userId is required").max(100),
});

/**
 * POST /api/auth/verify-otp
 * body: { mobile, otp, mode?, userId?, ulbId? }
 */
const verifyOtpSchema = z.object({
  mobile: mobileSchema,
  otp: otpSchema,
  mode: z.number().int().optional(),     // e.g. 2 = verify
  userId: z.string().trim().min(1, "userId is required").max(100),
});

/**
 * =========================
 * EMAIL / PASSWORD (OPTIONAL)
 * =========================
 */

/**
 * POST /api/auth/register
 * body: { name, email, mobile, password }
 */
const registerSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(100),
  email: z.string().trim().email("invalid email"),
  mobile: mobileSchema,
  password: z.string().min(6, "password must be at least 6 characters"),
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
const loginSchema = z.object({
  email: z.string().trim().email("invalid email"),
  password: z.string().min(1, "password is required"),
});

/**
 * =========================
 * TOKEN FLOW (OPTIONAL)
 * =========================
 */

/**
 * POST /api/auth/refresh
 * body: { refreshToken }
 */
const refreshSchema = z.object({
  refreshToken: z.string().min(10, "invalid refresh token"),
});

/**
 * POST /api/auth/logout
 * body: { refreshToken? }
 */
const logoutSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});


const loginProcSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  password: z.string().min(1, "password is required"),
  macaddr: z.string().optional().default(""),
  ipaddr: z.string().optional().default(""),
  hostname: z.string().optional().default(""),
  source: z.string().optional().default("RW"),
});


const changePasswordSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  oldPassword: z.string().min(1, "oldPassword is required"),
  newPassword: z
    .string()
    .min(6, "newPassword must be at least 6 characters"),
  ulbId: z.number().int().positive(),
});


module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
    loginProcSchema,
    changePasswordSchema
};
