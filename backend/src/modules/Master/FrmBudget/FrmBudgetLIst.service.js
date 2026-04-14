const repo = require("./FrmBudgetLIst.repo");
const { AppError } = require("../../../libs/errors");

// Budget List
async function getBudgetListService(fromDate, toDate) {
  if (!fromDate || !toDate) {
    throw new AppError("FromDate and ToDate required", 400);
  }

  const data = await repo.getBudgetList(fromDate, toDate);

  return { success: true, count: data.length, list: data };
}

// GL List
async function getGLListService() {
  const data = await repo.getGLList();
  return { success: true, count: data.length, list: data };
}

// Budget Head
async function getBudgetHeadListService() {
  const data = await repo.getBudgetHeadList();
  return { success: true, count: data.length, list: data };
}

// Budget By ID
async function getBudgetByIdService(budgetNo) {
  if (!budgetNo) throw new AppError("BudgetNo required", 400);

  const data = await repo.getBudgetById(budgetNo);

  if (!data.length) throw new AppError("Not found", 404);

  return { success: true, data: data[0] };
}

// GL Search
async function searchGLService(prefix) {
  if (!prefix) throw new AppError("Prefix required", 400);

  const data = await repo.searchGL(prefix);

  return { success: true, count: data.length, list: data };
}

// Procedure
async function budgetService(data) {
  if (!data.paramStr) throw new AppError("ParamStr required", 400);
  if (!data.userId) throw new AppError("UserId required", 400);

  const result = await repo.budgetProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure failed", 500);
  }

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }

  return {
    success: true,
    message: result.errorMsg,
    ...result,
  };
}

module.exports = {
  getBudgetListService,
  getGLListService,
  getBudgetHeadListService,
  getBudgetByIdService,
  searchGLService,
  budgetService,
};