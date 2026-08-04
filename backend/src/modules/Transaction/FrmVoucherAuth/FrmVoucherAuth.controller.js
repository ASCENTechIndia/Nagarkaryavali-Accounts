const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./FrmVoucherAuth.service");

exports.getVoucherAuthList = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const {ulbId, fromDate, toDate, zoneId, userId} = req.body;

  if (!ulbId) {throw new AppError("ulbId is required", 400)}
  if (!fromDate) {throw new AppError("fromDate is required", 400)}
  if (!toDate) {throw new AppError("toDate is required", 400)}

  const payload = {ulbId, fromDate, toDate, zoneId, userId};

  const data = await service.getVoucherAuthListService(payload);
  return ok(res, data, data.message ?? "Voucher approval list fetched successfully");
});

exports.getVoucherAuthById = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const {vchTransNo, ulbId} = req.body;

  if (!vchTransNo) {throw new AppError("vchTransNo is required", 400)}
  if (!ulbId) {throw new AppError("ulbId is required", 400)}

  const payload = {vchTransNo, ulbId};

  const data = await service.getVoucherAuthByIdService(payload);
  return ok(res, data, data.message ?? "Voucher details fetched successfully");
});

exports.saveVoucherApproval = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const {userId, refNo, status, remark} = req.body;

  if (!userId) {throw new AppError("userId is required", 400);}
  if (!refNo) {throw new AppError("refNo is required", 400);}
  if (!status) {throw new AppError("status is required", 400);}
  if (status !== "A" && status !== "R") {throw new AppError("status must be A or R", 400)}

  const payload = {userId, refNo, status, remark};

  const data = await service.saveVoucherApprovalService(payload);
  return ok(res, data, data.message ?? "Voucher approval executed successfully");
});