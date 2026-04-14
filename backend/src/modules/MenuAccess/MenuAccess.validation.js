//auth.validation.js
const { z } = require("zod");

/**
 * Common helpers
 */
const mobileSchema = z
  .string()
  .trim()
  .min(10, "mobile must be at least 10 digits")
  .max(15, "mobile is too long");

const otpSchema = z
  .string()
  .trim()
  .min(4, "otp must be at least 4 digits")
  .max(8, "otp is too long");

const idSchema = z.number().int().positive();

const idNumericSchema = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "string" ? v.trim() : v))
  .refine((v) => v !== "", "value is required")
  .transform((v) => Number(v))
  .refine((v) => Number.isFinite(v), "must be a valid number");

const nameSchema = z.string().trim().min(1, "usageTypeName is required").max(200);

const sourceSchema = z.string().trim().min(1).max(20).default("WEB");

const usageTypeInsertSchema = z.object({
  userId: z.string().default(""),
  SubUsageTypeId: idNumericSchema.default(0),
  usageTypeId: idNumericSchema.default(0),
  SubUsageTypeName: nameSchema,
  flag: z.string().optional().default("Y"),
  ipAddress: z.string().optional().default(""), // if you want to send numeric IP (else set 0),
  source: sourceSchema.optional().default("WEB"),
  mode: idNumericSchema.optional().default(1), // 1=insert, 2=update etc (as per your SP logic)
});


module.exports = {
    usageTypeInsertSchema
};
