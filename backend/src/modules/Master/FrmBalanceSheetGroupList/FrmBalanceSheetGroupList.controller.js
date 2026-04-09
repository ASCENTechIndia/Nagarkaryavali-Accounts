const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmBalanceSheetGroupList.service");

// List
exports.getBalGroupList = asyncHandler(async (req, res) => {
  const data = await service.getBalGroupListService();
  return ok(res, data, "Balance group list fetched");
});

// By ID
exports.getBalGroupById = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const data = await service.getBalGroupByIdService(id);

  return ok(res, data, "Balance group details fetched");
});

// Procedure
exports.balGroupMaster = asyncHandler(async (req, res) => {
  const data = await service.balGroupService(req.body);
  return ok(res, data, data.message);
});