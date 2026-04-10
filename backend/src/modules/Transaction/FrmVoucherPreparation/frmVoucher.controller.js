const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./frmVoucher.service");
const { AppError } = require("../../../libs/errors");

/* 1 */
exports.getPendingVouchers = asyncHandler(async (req, res) => {
  const data = await service.getPendingVouchersService(req.body);
  return ok(res, data);
});

/* 2 */
exports.getDepositeDropdown = asyncHandler(async (req, res) => {
  const data = await service.getDepositeDropdownService(req.body);
  return ok(res, data);
});

/* 3 */
exports.getSectionDropdown = asyncHandler(async (req, res) => {
  const data = await service.getSectionDropdownService();
  return ok(res, data);
});

/* 4 */
exports.getBudgetHeadDropdown = asyncHandler(async (req, res) => {
  const data = await service.getBudgetHeadService(req.body);
  return ok(res, data);
});

/* 5 */
exports.getBankDetails = asyncHandler(async (req, res) => {
  const data = await service.getBankDetailsService(req.body);
  return ok(res, data);
});

/* 6 */
exports.getVoucherDetails = asyncHandler(async (req, res) => {
  const data = await service.getVoucherDetailsService(req.body);
  return ok(res, data);
});

/* 7 */
exports.getVoucherDetailLines = asyncHandler(async (req, res) => {
  const data = await service.getVoucherDetailLinesService(req.body);
  return ok(res, data);
});

/* 8 */
exports.getAccountByGlAcc = asyncHandler(async (req, res) => {
  const data = await service.getAccountByGlAccService(req.body);
  return ok(res, data);
});

/* 9 */
exports.getSecDepositCode = asyncHandler(async (req, res) => {
  const data = await service.getSecDepositCodeService(req.body);
  return ok(res, data);
});

/* 10 */
exports.getAccountByFunctionObject = asyncHandler(async (req, res) => {
  const data = await service.getAccountByFunctionService(req.body);
  return ok(res, data);
});

/* 11 */
exports.getCorporationCode = asyncHandler(async (req, res) => {
  const data = await service.getCorporationCodeService(req.body);
  return ok(res, data);
});

/* 12 */
exports.getContracts = asyncHandler(async (req, res) => {
  const data = await service.getContractsService(req.body);
  return ok(res, data);
});

/* 13 */
exports.getContractAccYear = asyncHandler(async (req, res) => {
  const data = await service.getContractAccYearService(req.body);
  return ok(res, data);
});

/* 14 */
exports.getPartyBankDetails = asyncHandler(async (req, res) => {
  const data = await service.getPartyBankDetailsService(req.body);
  return ok(res, data);
});

/* 15 */
exports.getPartyTaxDetails = asyncHandler(async (req, res) => {
  const data = await service.getPartyTaxDetailsService(req.body);
  return ok(res, data);
});

/* 16 */
exports.getNidhiConfig = asyncHandler(async (req, res) => {
  const data = await service.getNidhiConfigService(req.body);
  return ok(res, data);
});

/* 17 */
exports.getGovtTaxAcc = asyncHandler(async (req, res) => {
  const data = await service.getGovtTaxAccService(req.body);
  return ok(res, data);
});

/* 18 */
exports.getVoucherReceiptDetails = asyncHandler(async (req, res) => {
  const data = await service.getVoucherReceiptDetailsService(req.body);
  return ok(res, data);
});

exports.saveVoucher = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const {
    userId,
    paramStr,
    paramStr2,
    paramStr3,
    paramStr4,
    zoneId,
  } = req.body;

  // ✅ VALIDATION
  if (!userId) throw new AppError("userId is required", 400);
  if (!paramStr) throw new AppError("paramStr is required", 400);
  if (!zoneId) throw new AppError("zoneId is required", 400);

  const payload = {
    userId,
    paramStr,
    paramStr2,
    paramStr3,
    paramStr4,
    zoneId,
  };

  const data = await service.saveVoucherService(payload);

  return ok(res, data, data.message);
});