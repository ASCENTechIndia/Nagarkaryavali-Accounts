const service = require("./FrmVoucherGeneration.service");
const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");


exports.getGLList = asyncHandler(async (req, res) => {
  res.json(await service.getGLListService());
});

exports.getPartyList = asyncHandler(async (req, res) => {
  res.json(await service.getPartyListService(req.body));
});

exports.getBalanceVoucher = asyncHandler(async (req, res) => {
  res.json(await service.getBalanceVoucherService(req.body));
});

exports.getVoucherPrep = asyncHandler(async (req, res) => {
  res.json(await service.getVoucherPrepService(req.body));
});

exports.getChequeBook = asyncHandler(async (req, res) => {
  res.json(await service.getChequeBookService(req.body));
});

exports.getVoucherDetails = asyncHandler(async (req, res) => {
  res.json(await service.getVoucherDetailsService(req.body));
});

exports.getVoucherTableDetails = asyncHandler(async (req, res) => {
  const result = await service.getVoucherTableDetailsService(req.body);

  res.json({
    success: true,
    message: "Voucher table details fetched successfully",
    data: result,
  });
});

// ✅ Voucher Generation Controller
exports.voucherGeneration = asyncHandler(async (req, res) => {
  const data = await service.voucherGenerationService(req.body);
  return ok(res, data, data.errorMsg);
});

exports.getVoucherTax = asyncHandler(async (req, res) => {
  res.json(await service.getVoucherTaxService(req.body));
});