const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmGrampanchayatList.service");

exports.getDeptList = asyncHandler(async (req, res) => {
  const data = await service.getDeptListService();
  return ok(res, data, "Department list fetched");
});

exports.getGrampanchList = asyncHandler(async (req, res) => {
  const { deptId } = req.query;
  const data = await service.getGrampanchListService(deptId);
  return ok(res, data, "Grampanch list fetched");
});

exports.getGrampanchById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await service.getGrampanchByIdService(id);
  return ok(res, data, "Grampanch details fetched");
});

exports.grampanchMaster = asyncHandler(async (req, res) => {
  const data = await service.grampanchService(req.body);
  return ok(res, data, data.message);
});