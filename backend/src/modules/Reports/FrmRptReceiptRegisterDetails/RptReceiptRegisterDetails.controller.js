const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./RptReceiptRegisterDetails.service");

// 1. Transaction Report
exports.getTransactionReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getTransactionReportService(filters);

  return ok(res, data, "Transaction report fetched");
});

// 2. Nidhi Config
exports.getNidhiConfig = asyncHandler(async (req, res) => {
  const { budgetId, ulbId } = req.query;

  const data = await service.getNidhiConfigService(budgetId, ulbId);

  return ok(res, data, "Nidhi config fetched");
});

exports.getDailyTransactionReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getDailyTransactionReportService(filters);

  return ok(res, data, "Daily transaction report fetched");
});

exports.getOpeningBalance = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getOpeningBalanceService(filters);

  return ok(res, data, "Opening balance calculated");
});