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