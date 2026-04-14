const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./frmBanList.service");

exports.getBankList = asyncHandler(async (req, res) => {
  console.log("📥 Request: Fetch Bank List");

  const data = await service.getBankListService();

  return ok(res, data, "Bank list fetched successfully");
});

exports.getBankById = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { bankId } = req.body;

  if (!bankId) {
    throw new AppError("bankId is required", 400);
  }

  const payload = { bankId };

  const data = await service.getBankByIdService(payload);

  return ok(res, data, "Bank details fetched successfully");
});

exports.saveBank = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { bankId, bankName, userId, mode } = req.body;

  if (!mode) {
    throw new AppError("mode is required (1=insert,2=update,3=delete)", 400);
  }

  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  if (!bankName && mode !== 3) {
    throw new AppError("bankName is required", 400);
  }

  const payload = {
    bankId,
    bankName,
    userId,
    mode,
  };

  const data = await service.saveBankService(payload);

  return ok(res, data, "Bank operation executed successfully");
});