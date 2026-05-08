const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmBankBalRpt.service");


// 1
exports.getAccountBalance = asyncHandler(async (req, res) => {

  const data = await service.getAccountBalanceService(req.body);

  return ok(res, data, "Account balance fetched");
});


// 2
exports.getMonthlySummary = asyncHandler(async (req, res) => {

  const data = await service.getMonthlySummaryService(req.body);

  return ok(res, data, "Monthly summary fetched");
});


// 3
exports.getDailySummary = asyncHandler(async (req, res) => {

  const data = await service.getDailySummaryService(req.body);

  return ok(res, data, "Daily summary fetched");
});


// 4
exports.getTransactionDetails = asyncHandler(async (req, res) => {

  const data = await service.getTransactionDetailsService(req.body);

  return ok(res, data, "Transaction details fetched");
});


// 5
exports.getSingleAccountBalance = asyncHandler(async (req, res) => {

  const data = await service.getSingleAccountBalanceService(req.body);

  return ok(res, data, "Single account balance fetched");
});