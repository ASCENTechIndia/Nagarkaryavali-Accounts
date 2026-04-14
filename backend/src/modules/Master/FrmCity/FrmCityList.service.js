const repo = require("./FrmCityList.repo");
const { AppError } = require("../../../libs/errors");

// State
async function getStateListService() {
  const data = await repo.getStateList();
  return { success: true, count: data.length, list: data };
}

// District
async function getDistrictListService() {
  const data = await repo.getDistrictList();
  return { success: true, count: data.length, list: data };
}

async function getDistrictByStateService(stateId) {
  if (!stateId) throw new AppError("StateId required", 400);

  const data = await repo.getDistrictByState(stateId);
  return { success: true, count: data.length, list: data };
}

// City
async function getCityByDistrictService(districtId) {
  if (!districtId) throw new AppError("DistrictId required", 400);

  const data = await repo.getCityByDistrict(districtId);
  return { success: true, count: data.length, list: data };
}
async function getStateByDistrictService(districtId) {
  if (!districtId) {
    throw new AppError("DistrictId is required", 400);
  }

  const data = await repo.getStateByDistrict(districtId);

  if (!data || data.length === 0) {
    throw new AppError("State not found for given DistrictId", 404);
  }

  return {
    success: true,
    data: data[0], // { Stateid: ... }
  };
}
async function getCityByIdService(cityId, districtId) {
  if (!cityId || !districtId) {
    throw new AppError("CityId & DistrictId required", 400);
  }

  const data = await repo.getCityById(cityId, districtId);

  if (!data.length) throw new AppError("City not found", 404);

  return { success: true, data: data[0] };
}

// Procedure
async function cityService(data) {
  if (!data.mode) throw new AppError("Mode required", 400);
  if (!data.userId) throw new AppError("UserId required", 400);
  if (!data.cityName) throw new AppError("City name required", 400);

  if (data.mode !== 1 && !data.cityId) {
    throw new AppError("CityId required for update/delete", 400);
  }

  const result = await repo.cityProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure failed", 500);
  }

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }

  

  return { success: true,  ...result };
}

module.exports = {
  getStateListService,
  getDistrictListService,
  getDistrictByStateService,
  getCityByDistrictService,
  getStateByDistrictService,
  getCityByIdService,
  cityService,
};