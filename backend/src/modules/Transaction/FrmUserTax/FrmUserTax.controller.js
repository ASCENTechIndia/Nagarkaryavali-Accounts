const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmUserTax.service");
const path = require("path");

exports.getAccUserMapList = asyncHandler(async (req, res) => {
  const data = await service.getAccUserMapListService(req.body);

  return ok(res, data, "Account mapping list fetched successfully");
});

exports.getAccUserMapById = asyncHandler(async (req, res) => {
  const data = await service.getAccUserMapByIdService(req.body);

  return ok(res, data, "Account mapping details fetched successfully");
});

exports.saveAccUserMap = asyncHandler(async (req, res) => {
  const data = await service.saveAccUserMapService(req.body);

  return ok(res, data, data.errorMsg);
});
