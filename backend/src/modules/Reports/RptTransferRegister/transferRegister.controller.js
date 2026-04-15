const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./transferRegister.service");
const { AppError } = require("../../../libs/errors");


exports.getTransTypeService = asyncHandler(async (req, res) => {
  console.log("📥 Request received");

  const data = await service.getTransTypeService();

  return ok(res, data, "Transfer Register fetched successfully");
});

exports.getTransactionRegisterReport = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { fromDate, toDate, trnstypeid, zoneId, ulbId } = req.body;

  if (!fromDate) throw new AppError("fromDate is required", 400);
  if (!toDate) throw new AppError("toDate is required", 400);
  if (!trnstypeid?.length)
    throw new AppError("trnstypeid is required", 400);
  if (!zoneId) throw new AppError("zoneId is required", 400);
  if (!ulbId) throw new AppError("ulbId is required", 400);

  const payload = { fromDate, toDate, trnstypeid, zoneId, ulbId };

  const data = await service.getTransactionRegisterReportService(payload);

  return ok(res, data, "Transaction Register Report fetched successfully");
});