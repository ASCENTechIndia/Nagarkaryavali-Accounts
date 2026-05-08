const repo = require("./FrmBankBalRpt.repo");
const { AppError } = require("../../../libs/errors");

async function getAccountBalanceService(filters) {

  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  const data = await repo.getAccountBalanceReport(filters);

  return {
    success: true,
    count: data.length,
    list: data
  };
}


async function getMonthlySummaryService(filters) {

  const data = await repo.getMonthlySummaryReport(filters);

  return {
    success: true,
    count: data.length,
    list: data
  };
}


async function getDailySummaryService(filters) {

  const data = await repo.getDailySummaryReport(filters);

  return {
    success: true,
    count: data.length,
    list: data
  };
}


async function getTransactionDetailsService(filters) {

  const data = await repo.getTransactionDetailsReport(filters);

  return {
    success: true,
    count: data.length,
    list: data
  };
}


async function getSingleAccountBalanceService(filters) {

  const data = await repo.getSingleAccountBalance(filters);

  return {
    success: true,
    list: data
  };
}


module.exports = {
  getAccountBalanceService,
  getMonthlySummaryService,
  getDailySummaryService,
  getTransactionDetailsService,
  getSingleAccountBalanceService
};