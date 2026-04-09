const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmDistrictList.service");

exports.getDistrictListByState = asyncHandler(async (req, res) => {
  const { stateId } = req.query;

  const data = await service.getDistrictListByStateService(stateId);

  return ok(res, data, "District list fetched");
});

exports.getDistrictById = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const data = await service.getDistrictByIdService(id);

  return ok(res, data, "District details fetched");
});

exports.districtMaster = asyncHandler(async (req, res) => {
  const data = await service.districtService(req.body);
  return ok(res, data, data.message);
});

exports.getStateById = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const data = await service.getStateByIdService(id);

  return ok(res, data, "State details fetched");
});


exports.stateMaster = asyncHandler(async (req, res) => {
  const data = await service.stateService(req.body);
  return ok(res, data, data.message);
});