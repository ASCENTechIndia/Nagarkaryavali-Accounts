const repo = require("./RptReceiptRegisterDetails.repo");
const { AppError } = require("../../../libs/errors");

// 1. Transaction Report
async function getTransactionReportService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("FromDate and ToDate are required", 400);
  }

  const data = await repo.getTransactionReport(filters);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// 2. Nidhi Config
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


// Daily Transaction Report
async function getDailyTransactionReportService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.trnsDate) {
    throw new AppError("Transaction Date is required", 400);
  }

  const data = await repo.getDailyTransactionReport(filters);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getOpeningBalanceService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.trnsDate) {
    throw new AppError("Transaction Date is required", 400);
  }

  const balance = await repo.getOpeningBalance(filters);

  return {
    success: true,
    closingBalance: balance,
  };
}
module.exports = {
  getTransactionReportService,
  getNidhiConfigService,
  getDailyTransactionReportService,
getOpeningBalanceService,
};