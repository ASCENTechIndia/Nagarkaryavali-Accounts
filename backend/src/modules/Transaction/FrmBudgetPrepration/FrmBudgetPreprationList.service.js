const repo = require("./FrmBudgetPreprationList.repo");
const { AppError } = require("../../../libs/errors");

// Account List
async function getAccountBySubTypeService(subTypeId) {
  if (!subTypeId) {
    throw new AppError("SubTypeId is required", 400);
  }

  const data = await repo.getAccountBySubType(subTypeId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// Procedure
async function budgetPreparationService(data) {
  if (!data.userId) throw new AppError("UserId required", 400);
  if (!data.ulbId) throw new AppError("ULBId required", 400);
  if (!data.paramStr) throw new AppError("ParamStr required", 400);

  const result = await repo.budgetPreparationProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure failed", 500);
  }

  if (result.errorCode < 0) {
    throw new AppError(result.errorMsg, 400);
  }

  return {
    success: true,
    message: result.errorMsg,
    errorCode: result.errorCode,
  };
}
// Account SubType List
async function getAccSubTypeListService() {
  const data = await repo.getAccSubTypeList();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}
module.exports = {
  getAccountBySubTypeService,
  budgetPreparationService,
  getAccSubTypeListService,
};