const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmCityList.service");

exports.getStateList = asyncHandler(async (req, res) => {
  const data = await service.getStateListService();
  return ok(res, data, "State list fetched");
});

exports.getDistrictList = asyncHandler(async (req, res) => {
  const data = await service.getDistrictListService();
  return ok(res, data, "District list fetched");
});

exports.getDistrictByState = asyncHandler(async (req, res) => {
  const { stateId } = req.query;
  const data = await service.getDistrictByStateService(stateId);
  return ok(res, data, "District list fetched");
});

exports.getCityByDistrict = asyncHandler(async (req, res) => {
  const { districtId } = req.query;
  const data = await service.getCityByDistrictService(districtId);
  return ok(res, data, "City list fetched");
});
exports.getStateByDistrict = asyncHandler(async (req, res) => {
  const { districtId } = req.query;

  const data = await service.getStateByDistrictService(districtId);

  return ok(res, data, "State fetched by district");
});
exports.getCityById = asyncHandler(async (req, res) => {
  const { cityId, districtId } = req.query;
  const data = await service.getCityByIdService(cityId, districtId);
  return ok(res, data, "City details fetched");
});

exports.cityMaster = asyncHandler(async (req, res) => {
  const data = await service.cityService(req.body);
  return ok(res, data, data.message);
});