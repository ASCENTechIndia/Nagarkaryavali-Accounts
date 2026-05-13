const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./FrmCashDepositReprint.service");

exports.getReceiptReport = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { fromDate, toDate, ulbId, paymode } = req.body;

  if (!fromDate) throw new AppError("fromDate is required", 400);
  if (!toDate) throw new AppError("toDate is required", 400);
  if (!ulbId) throw new AppError("ulbId is required", 400);

  const payload = { fromDate, toDate, ulbId, paymode };

  const data = await service.getReceiptReportService(payload);

  return ok(res, data, "Receipt Report fetched successfully");
});

exports.getPayModes = asyncHandler(async (req, res) => {
  const { ulbId } = req.query;

  if (!ulbId) throw new AppError("ulbId is required", 400);

  const payload = { ulbId };

  const data = await service.getPayModesService(payload);

  return ok(res, data, "Pay modes fetched successfully");
});
