const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./frmSDRef.service");

function validate(fields, body) {
  for (const field of fields) {
    if (!body[field]) {
      throw new AppError(`${field} is required`, 400);
    }
  }
}

exports.searchPartiesConcatenated = asyncHandler(async (req, res) => {
  validate(["ulbId"], req.body);
  const data = await service.searchPartiesConcatenatedService(req.body);
  return ok(res, data, "Party search fetched successfully");
});

exports.searchPartiesStandard = asyncHandler(async (req, res) => {
  validate(["ulbId"], req.body);
  const data = await service.searchPartiesStandardService(req.body);
  return ok(res, data, "Party list fetched successfully");
});

exports.getSdRefundList = asyncHandler(async (req, res) => {
  validate(["ulbId"], req.body);
  const data = await service.getSdRefundListService(req.body);
  return ok(res, data, "SD Refund list fetched successfully");
});

exports.getCreditGLMaster = asyncHandler(async (req, res) => {
  const data = await service.getCreditGLMasterService();
  return ok(res, data, "Credit GL list fetched successfully");
});

exports.getDebitGLMaster = asyncHandler(async (req, res) => {
  const data = await service.getDebitGLMasterService();
  return ok(res, data, "Debit GL list fetched successfully");
});

exports.checkRefundStatus = asyncHandler(async (req, res) => {
  validate(["refNo", "partyId", "recNo", "ulbId"], req.body);
  const data = await service.checkRefundStatusService(req.body);
  return ok(res, data, "Refund status fetched successfully");
});

exports.getVoucherBySDID = asyncHandler(async (req, res) => {
  validate(["sdid"], req.body);
  const data = await service.getVoucherBySDIDService(req.body);
  return ok(res, data, "Voucher fetched successfully");
});

exports.getSDVoucherMaster = asyncHandler(async (req, res) => {
  validate(["refNo", "partyId", "ulbId", "sdid"], req.body);
  const data = await service.getSDVoucherMasterService(req.body);
  return ok(res, data, "Voucher master fetched successfully");
});

exports.getPartyBankDetails = asyncHandler(async (req, res) => {
  validate(["partyBankId", "ulbId"], req.body);
  const data = await service.getPartyBankDetailsService(req.body);
  return ok(res, data, "Party bank details fetched successfully");
});

exports.getSDVoucherDetails = asyncHandler(async (req, res) => {
  validate(["refNo", "partyId", "sdid", "ulbId"], req.body);
  const data = await service.getSDVoucherDetailsService(req.body);
  return ok(res, data, "Voucher details fetched successfully");
});

exports.getVoucherPrepMaster = asyncHandler(async (req, res) => {
  validate(["refNo", "ulbId"], req.body);
  const data = await service.getVoucherPrepMasterService(req.body);
  return ok(res, data, "Voucher prep master fetched successfully");
});

exports.getGeneralBankDetails = asyncHandler(async (req, res) => {
  validate(["partyBankId"], req.body);
  const data = await service.getGeneralBankDetailsService(req.body);
  return ok(res, data, "Bank details fetched successfully");
});

exports.getSDUpdatedDetails = asyncHandler(async (req, res) => {
  validate(["refNo", "ulbId"], req.body);
  const data = await service.getSDUpdatedDetailsService(req.body);
  return ok(res, data, "Updated details fetched successfully");
});

exports.getSDAccountSubtype = asyncHandler(async (req, res) => {
  validate(["debitGl", "debitAcc", "ulbId"], req.body);
  const data = await service.getSDAccountSubtypeService(req.body);
  return ok(res, data, "Account subtype fetched successfully");
});

exports.getPartyBankList = asyncHandler(async (req, res) => {
  validate(["partyId"], req.body);
  const data = await service.getPartyBankListService(req.body);
  return ok(res, data, "Party bank list fetched successfully");
});

exports.getBudgetBalance = asyncHandler(async (req, res) => {
  validate(["creditGl", "creditAcc", "ulbId"], req.body);
  const data = await service.getBudgetBalanceService(req.body);
  return ok(res, data, "Budget balance fetched successfully");
});

exports.getPartyTaxDetails = asyncHandler(async (req, res) => {
  validate(["partyId", "ulbId"], req.body);
  const data = await service.getPartyTaxDetailsService(req.body);
  return ok(res, data, "Party tax details fetched successfully");
});

exports.getSDVoucherPrepReceiptDetails = asyncHandler(async (req, res) => {
  validate(["voucherNo", "ulbId"], req.body);
  const data = await service.getSDVoucherPrepReceiptDetailsService(req.body);
  return ok(res, data, "Receipt details fetched successfully");
});

exports.getSDReferenceInfo = asyncHandler(async (req, res) => {
  validate(["sdid", "ulbId"], req.body);
  const data = await service.getSDReferenceInfoService(req.body);
  return ok(res, data, "Reference info fetched successfully");
});

exports.saveSdRefundVoucher = asyncHandler(async (req, res) => {
  validate(["userId", "paramStr"], req.body);
  const data = await service.saveSdRefundVoucherService(req.body);
  return ok(res, data, "SD Refund voucher saved successfully");
});