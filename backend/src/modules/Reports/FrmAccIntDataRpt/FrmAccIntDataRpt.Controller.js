

const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmAccIntDataRpt.Service");

exports.getDepartmentTransactions = asyncHandler(async (req, res) => {
  const data = await service.getDepartmentTransactionsService(req.body);
  return ok(res, data, "Department transactions fetched successfully");
});


exports.getCorporation = asyncHandler(async (req, res) => {
  const data = await service.getCorporationService(req.body);
  return ok(res, data, "Corporation info fetched successfully");
});