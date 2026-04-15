const { AppError } = require("../../../libs/errors");
const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./rptCashBankBalance.service");

exports.getGrampanchayatList = asyncHandler(async (req, res) => {
  const { deptId } = req.body;

  if (!deptId) {
    throw new AppError("deptId is required", 400);
  }

  const data = await service.getGrampanchayatListService({ deptId });

  return ok(res, data, "Grampanchayat List fetched successfully");
});

exports.getCashBankBalanceReport = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { asOnDate, zoneId, ulbId } = req.body;

  if (!asOnDate) throw new AppError("asOnDate is required", 400);
  if (!zoneId) throw new AppError("zoneId is required", 400);
  if (!ulbId) throw new AppError("ulbId is required", 400);

  const payload = { asOnDate, zoneId, ulbId };

  const data = await service.getCashBankBalanceReportService(payload);

  return ok(res, data, "Cash Bank Balance Report fetched successfully");
});