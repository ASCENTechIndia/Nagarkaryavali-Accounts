const repo = require("./FrmDistrictList.repo");
const { AppError } = require("../../../libs/errors");

// List by State
async function getDistrictListByStateService(stateId) {
  if (!stateId) {
    throw new AppError("StateId is required", 400);
  }

  const data = await repo.getDistrictListByState(stateId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// By ID
async function getDistrictByIdService(districtId) {
  if (!districtId) {
    throw new AppError("DistrictId is required", 400);
  }

  const data = await repo.getDistrictById(districtId);

  if (!data || data.length === 0) {
    throw new AppError("District not found", 404);
  }

  return {
    success: true,
    data: data[0],
  };
}

// Procedure
async function districtService(data) {
  if (!data.mode) throw new AppError("Mode required", 400);
  if (!data.userId) throw new AppError("UserId required", 400);
  if (!data.districtName) throw new AppError("District Name required", 400);

  if (data.mode !== 1 && !data.districtId) {
    throw new AppError("DistrictId required for update/delete", 400);
  }

  const result = await repo.districtProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure failed", 500);
  }

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }



  return { success: true,  ...result };
}

async function getStateByIdService(stateId) {
  if (!stateId) {
    throw new AppError("StateId is required", 400);
  }

  const data = await repo.getStateById(stateId);

  if (!data || data.length === 0) {
    throw new AppError("State not found", 404);
  }

  return {
    success: true,
    data: data[0],
  };
}

async function stateService(data) {
  if (!data.mode) throw new AppError("Mode required (1,2,3)", 400);
  if (!data.userId) throw new AppError("UserId required", 400);
  if (!data.stateName) throw new AppError("State Name required", 400);

  if (data.mode !== 1 && !data.stateId) {
    throw new AppError("StateId required for update/delete", 400);
  }

  const result = await repo.stateProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure failed", 500);
  }

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }

  

  return {
    success: true,

    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
  };
}
module.exports = {
  getDistrictListByStateService,
  getDistrictByIdService,
  districtService,
  getStateByIdService,
  stateService,
};