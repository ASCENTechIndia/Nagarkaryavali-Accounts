const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmUserDepartmentMapping.service");

exports.userZoneDeptMaster = asyncHandler(async (req, res) => {
  const data = await service.userZoneDeptMasterService(req.body);

  return ok(res, data, data.message);
});

exports.getUserZoneDeptList = asyncHandler(async (req, res) => {
    const data = await service.getUserZoneDeptListService(req.body);

    return ok(res, data, "User Zone Department List fetched successfully");
});