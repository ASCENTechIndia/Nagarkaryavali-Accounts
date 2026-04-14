const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./BalanceSheetSubGroupList.service");

exports.getBalGroupList = asyncHandler(async (req, res) => {
  const data = await service.getBalGroupListService();
  return ok(res, data, "Balance group list fetched");
});

exports.getBalSubGroupList = asyncHandler(async (req, res) => {
  const { groupId } = req.query;

  const data = await service.getBalSubGroupListService(groupId);

  return ok(res, data, "Balance subgroup list fetched");
});

exports.balSubGroupMaster = asyncHandler(async (req, res) => {
  const data = await service.balSubGroupService(req.body);
  return ok(res, data, data.message);
});

exports.getBalSubGroupById = asyncHandler(async (req, res) => {
  const subGroupId = req.params.id;

  const data = await service.getBalSubGroupByIdService(subGroupId);

  return ok(res, data, "Balance subgroup details fetched");
});
