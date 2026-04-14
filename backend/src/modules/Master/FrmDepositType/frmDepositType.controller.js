const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./frmDepositType.service");

exports.getDepositTypes = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { ulbId } = req.body;

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const payload = { ulbId };

  const data = await service.getDepositTypeService(payload);

  return ok(res, data, "Deposit types fetched successfully");
});

exports.getDepositTypeById = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { depId } = req.body;

  if (!depId) {
    throw new AppError("depId is required", 400);
  }

  const payload = { depId };

  const data = await service.getDepositTypeByIdService(payload);

  return ok(res, data, "Deposit type fetched successfully");
});

exports.saveDepositType = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { depId, depName, userId, mode, ulbId } = req.body;

  if (!mode) {
    throw new AppError("mode is required (1=insert,2=update,3=delete)", 400);
  }
  if (!userId) {
    throw new AppError("userId is required", 400);
  }
  if (!depName && mode !== 3) {
    throw new AppError("depName is required", 400);
  }
  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }
  if (mode !== 1 && !depId) {
    throw new AppError("depId is required for update/delete", 400);
  }

  const payload = {
    depId,
    depName,
    userId,
    mode,
    ulbId,
  };

  const data = await service.saveDepositTypeService(payload);

  return ok(res, data, "Deposit type operation executed successfully");
});