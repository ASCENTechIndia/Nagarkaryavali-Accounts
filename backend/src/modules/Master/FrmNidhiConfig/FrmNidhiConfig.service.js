const repo = require("./FrmNidhiConfig.repo");
const { AppError } = require("../../../libs/errors");

// ✅ List
async function getNidhiListConfigService(params) {
  const data = await repo.getNidhiListConfig(params);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// ✅ Master
async function getNidhiMstConfigService(params) {
  const data = await repo.getNidhiMstConfig(params);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// ✅ Insert / Update
async function insertNidhiConfigService(data) {
  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }
  if (!data.ulbId) {
    throw new AppError("ULB Id is required", 400);
  }
  if (!data.budgetId) {
    throw new AppError("Budget Id is required", 400);
  }

  const result = await repo.insertNidhiConfig(data);

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
  getNidhiListConfigService,
  getNidhiMstConfigService,
  insertNidhiConfigService,
};