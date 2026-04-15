const repo = require("./RptClassifiedRegisterDetails.repo");
const { AppError } = require("../../../libs/errors");

// 1. Nidhi Config
async function getNidhiConfigService(budgetId, ulbId) {
  if (!budgetId) {
    throw new AppError("BudgetId is required", 400);
  }

  if (!ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  const data = await repo.getNidhiConfig(budgetId, ulbId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// 2. Monthly Summary Report
async function getMonthlySummaryReportService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("FromDate and ToDate are required", 400);
  }

 
  const data = await repo.getMonthlySummaryReport(filters);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

module.exports = {
  getNidhiConfigService,
  getMonthlySummaryReportService,
};