
import { z } from "zod";

/* ================= SCHEMA ================= */

export const transferSchema = z.object({
  department: z.string().min(1, "प्रभाग निवडा"),
  transactionType: z.string().min(1, "व्यवहार प्रकार निवडा"),
  date: z.any().refine((val) => val !== null, {
    message: "दिनांक निवडा",
  }),
  voucherNo: z.string().min(1, "वाउचर क्रमांक भरा"),

  creditDept: z.string().min(1, "जमा विभाग कोड भरा"),
  creditLedger: z.string().min(1, "जमा लेखाशिर्ष भरा"),
  creditAmount: z
    .string()
    .min(1, "जमा रक्कम भरा")
    .refine((val) => !isNaN(val), {
      message: "जमा रक्कम योग्य नाही",
    }),

  chequeNo: z.string().optional(),
  chequeDate: z.any().optional(),
  chequeRef: z.string().optional(),
  details: z.string().optional(),
  party: z.string().optional(),

  debitDept: z.string().min(1, "खर्च विभाग कोड भरा"),
  debitLedger: z.string().min(1, "खर्च लेखाशिर्ष भरा"),
  debitAmount: z
    .string()
    .min(1, "खर्च रक्कम भरा")
    .refine((val) => !isNaN(val), {
      message: "खर्च रक्कम योग्य नाही",
    }),
}).refine(
  (data) =>
    Number(data.creditAmount || 0) === Number(data.debitAmount || 0),
  {
    message: "जमा आणि खर्च रक्कम समान असावी",
    path: ["creditAmount"],
  }
);

/* ================= VALIDATOR FUNCTION ================= */

export const validateTransfer = (values) => {
  const result = transferSchema.safeParse(values);

  if (!result.success) {
    return result.error.issues;
  }

  return null;
};
