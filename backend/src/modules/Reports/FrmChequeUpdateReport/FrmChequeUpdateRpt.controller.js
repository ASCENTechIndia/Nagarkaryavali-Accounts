const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmChequeUpdateRpt.service");

exports.getChequeUpdateReport = asyncHandler(async (req, res) => {
  const data = await service.getChequeUpdateReportService(req.body);
  return ok(res, data, "Cheque update report fetched successfully");
});
