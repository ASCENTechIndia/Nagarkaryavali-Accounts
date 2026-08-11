const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmUserDepartmentMapping.service");

exports.userDeptMaster = asyncHandler(async (req, res) => {
  const data = await service.userDeptMasterService(req.body);
  return ok(res, data, data.message);
});

exports.getUserDeptList = asyncHandler(async (req, res) => {
  const data = await service.getUserDeptListService(req.body);
  return ok(res, data, "User Department List fetched successfully");
});

exports.userZoneMaster = asyncHandler(async (req, res) => {
  const data = await service.userZoneMasterService(req.body);
  return ok(res, data, data.message);
});

exports.getUserZoneList = asyncHandler(async (req, res) => {
  const data = await service.getUserZoneListService(req.body);
  return ok(res, data, "User Zone List fetched successfully");
});