const repo = require("./FrmChecRegister.repo");
const { AppError } = require("../../../libs/errors");

// 1. Cheque Register Report
async function getChequeRegisterReportService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("FromDate and ToDate are required", 400);
  }

  const data = await repo.getChequeRegisterReport(filters);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// 2. Search Accounts
async function searchAccountsService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.prefix) {
    throw new AppError("Search prefix is required", 400);
  }

  const data = await repo.searchAccounts(filters);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// 3. Search GL Heads
async function searchGLHeadsService(filters) {
  if (!filters.prefix) {
    throw new AppError("Search prefix is required", 400);
  }

  const data = await repo.searchGLHeads(filters);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

module.exports = {
  getChequeRegisterReportService,
  searchAccountsService,
  searchGLHeadsService,
};