const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./FrmTranUpdate.service");


exports.getVchGenTransView = asyncHandler(async (req, res) => {
  const result = await service.getVchGenTransView(req.query);

  return ok(res, result, "Data fetched successfully");
});


exports.getTransView = asyncHandler(async (req, res) => {
  const result = await service.getTransView(req.query);

  return ok(res, result, "Data fetched successfully");
});


exports.deleteTransaction = asyncHandler(async (req, res) => {
  const result = await service.deleteTransaction(req.body);

  return ok(res, result, result.errorMsg);
});

exports.getRevokeList = asyncHandler(async (req, res) => {
  const result = await service.getRevokeList(req.query);

  return ok(res, result, "Data fetched successfully");
});