const repo = require("./Frmauthorizationconfig.repo");
const { AppError } = require("../../../libs/errors");

// List
async function getAuthorizationConfigListService() {
  const data = await repo.getAuthorizationConfigList();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// Update Details Service
async function getAuthorizationConfigDetailsService() {
  const data = await repo.getAuthorizationConfigDetails();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}
// 🔥 Procedure Service
async function authorizationConfigService(data) {
  if (!data.ulbId) {
    throw new AppError("ULB is required", 400);
  }

  if (!data.flag) {
    throw new AppError("Flag is required", 400);
  }

  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }

  if (!data.mode) {
    throw new AppError("Mode is required (1=Insert,2=Update,3=Delete)", 400);
  }

  if (data.mode !== 1 && !data.authorizId) {
    throw new AppError("AuthorizId required for update/delete", 400);
  }

  const result = await repo.authorizationConfigProc(data);

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
  getAuthorizationConfigListService,
  getAuthorizationConfigDetailsService,
  authorizationConfigService, 
};
