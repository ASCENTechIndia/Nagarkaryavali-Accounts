import { z } from "zod";

export const requiredString = (msg = "This field is required") =>
  z
    .string()
    .min(1, msg)
    .regex(/^[a-zA-Z0-9]+$/, `${msg} (Only alphabets and numbers allowed)`);

export const optionalString = () => z.string().optional();

export const mobileNumber = (msg = "Invalid mobile number") =>
  z
    .union([z.string(), z.number()])
    .transform((val) => String(val)) // convert number → string
    .refine(
      (val) => /^[6-9]\d{9}$/.test(val),
      "Mobile number must start with 6,7,8,9 and should be of 10 digits only"
    )
    .refine(
      (val) => !/^(\d)\1{9}$/.test(val),
      "Mobile number cannot be all same digits"
    );


export const requiredDate = (msg = "Date is required") =>
  z.date({ required_error: msg });

export const optionalBoolean = () => z.boolean().optional();

export const passwordField = () => z.string().optional();


export const wardSchema = z.object({

  zoneId: z.string().min(1, "Please select Zone"),

  wardNo: z
    .string()
    .min(1, "Ward No is required")
    .regex(/^[0-9]+$/, "Ward No must be numeric"),

  wardCode: z
    .string()
    .min(1, "Ward Code is required")
    .regex(/^[a-zA-Z0-9\s]+$/, "Special characters not allowed"),

  remark: z
    .string()
    .max(200, "Remark cannot exceed 200 characters")
    .optional(),

  status: z.string()

});

export const ReceiptSchema = z.object({
  zoneId: z.string().min(1, "Please select Zone"),

  reciptNO: z
    .string()
    .min(1, "recipt NO is required")
    .regex(/^[0-9]+$/, "Ward No must be numeric"),

  wardCode: z
    .string()
    .min(1, "Ward Code is required")
    .regex(/^[a-zA-Z0-9\s]+$/, "Special characters not allowed"),

  head: z
    .string()
    .min(1, "Ledger Head is required"),

  totalAmount: z
    .string()
    .min(1, "Total Amount is required")
    .regex(/^[0-9]+$/, "Amount must be numeric"),

  remark: z
    .string()
    .max(200, "Remark cannot exceed 200 characters")
    .optional(),

  status: z.string().min(1, "Status is required"),

  date: z.date({
    required_error: "Date is required",
    invalid_type_error: "Invalid date format",
  }),

  // Entry form fields
  entryDeptCode: z
    .string()
    .min(1, "Entry Dept Code is required"),

  entryHead: z
    .string()
    .min(1, "Entry Ledger Head is required"),

  entryAmount: z
    .string()
    .min(1, "Entry Amount is required")
    .regex(/^[0-9]+$/, "Amount must be numeric"),

  finalTotal: z
    .string()
    .min(1, "Final Total is required")
    .regex(/^[0-9]+$/, "Final Total must be numeric"),
});

export const PaymentSchema = z.object({
  zoneId: z.string().min(1, "प्रभाग निवडा"),

  transactionType: z.string().min(1, "व्यवहार प्रकार निवडा"),

  debtorType: z.string().min(1, "देवक प्रकार निवडा"),

  date: z.date({
    required_error: "दिनांक आवश्यक आहे",
  }),

  deptCode: z
    .string()
    .min(1, "विभाग कोड आवश्यक आहे")
    .regex(/^[a-zA-Z0-9\s]+$/, "Special characters not allowed"),

  ledgerHead: z
    .string()
    .min(1, "लेखाशीर्ष आवश्यक आहे"),

  voucherNo: z
    .string()
    .min(1, "व्हाउचर क्रमांक आवश्यक आहे")
    .regex(/^[0-9]+$/, "फक्त अंक टाका"),

  bankBalance: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]+$/.test(val), {
      message: "फक्त अंक टाका",
    }),

  chequeNo: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]+$/.test(val), {
      message: "फक्त अंक टाका",
    }),

  chequePageNo: z
    .string()
    .optional(),

  chequeDate: z.date().optional(),

  costomerName: z
    .string()
    .min(1, "नाव आवश्यक आहे"),

  debtorDeptCode: z
    .string()
    .min(1, "विभाग कोड आवश्यक आहे"),

  debtorLedgerHead: z
    .string()
    .min(1, "लेखाशीर्ष आवश्यक आहे"),

  amount: z
    .string()
    .min(1, "रक्कम आवश्यक आहे")
    .regex(/^[0-9]+$/, "फक्त अंक टाका"),

  details: z
    .string()
    .max(200, "तपशील 200 अक्षरांपेक्षा जास्त नसावा")
    .optional(),

  partyCode: z.string().min(1, "पार्टी निवडा"),
});



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


export const validateTransfer = (values) => {
  const result = transferSchema.safeParse(values);

  if (!result.success) {
    return result.error.issues;
  }

  return null;
};

export const voucherSchema = z
  .object({
    department: z.string().min(1, "प्रभाग निवडा"),

    fromDate: z.date({
      required_error: "दिनांक पासून आवश्यक आहे",
    }),

    toDate: z.date({
      required_error: "दिनांक पर्यंत आवश्यक आहे",
    }),

    partyCode: z.string().optional(),

    deptCode: z.string().min(1, "विभाग कोड आवश्यक आहे"),

    ledger: z.string().min(1, "लेखाशिर्ष आवश्यक आहे"),

    amount: z
      .string()
      .min(1, "रक्कम आवश्यक आहे")
      .refine((val) => !isNaN(val), {
        message: "रक्कम नंबर असावी",
      }),

    paymentType: z.string(),

    chequeNo: z.string().optional(),

    chequeDate: z.date().optional(),

    details: z.string().optional(),
  })

  /* ✅ CONDITIONAL VALIDATION */
  .refine(
    (data) => {
      if (data.paymentType === "Cheque") {
        return data.chequeNo && data.chequeDate;
      }
      return true;
    },
    {
      message: "Cheque तपशील आवश्यक आहे",
      path: ["chequeNo"],
    }
  );

  export const validateVoucher = (values) => {
  const result = voucherSchema.safeParse(values);

  if (!result.success) {
    return result.error.issues;
  }

  return null;
};

// ContractMst
export const contractValidationSchema = z.object({
  prabhag: z.string().min(1, "प्रभाग निवडा"),
  contractor: z.string().min(1, "कॉन्ट्रॅक्टर निवडा"),
  contractDate: z.date().refine(date => date instanceof Date && !isNaN(date), "कॉन्ट्रॅक्ट दिनांक निवडा"),
  contractAmount: z.string()
    .min(1, "कॉन्ट्रॅक्ट रक्कम भरा")
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "कृपया वैध रक्कम भरा"),
  startDate: z.date().refine(date => date instanceof Date && !isNaN(date), "प्रारंभ दिनांक निवडा"),
  endDate: z.date().refine(date => date instanceof Date && !isNaN(date), "शेवटची दिनांक निवडा"),
  description: z.string().min(1, "तपशील भरा"),
  administrativeApproval: z.string().optional(),
  newspaperName: z.string().optional(),
  tenderApproval: z.string().optional(),
});
