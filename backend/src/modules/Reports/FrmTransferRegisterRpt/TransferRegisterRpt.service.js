const repo = require("./TransferRegisterRpt.repo");
const { AppError } = require("../../../libs/errors");


// ================= DETAILS =================
async function getCashbookDetailsService(filters) {

  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("FromDate and ToDate are required", 400);
  }

  const data = await repo.getCashbookDetails(filters);

  return {
    success: true,
    count: data.length,
    list: data
  };
}


// ================= SUMMARY =================
async function getCashbookSummaryService(filters) {

  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("FromDate and ToDate are required", 400);
  }

  const data = await repo.getCashbookSummary(filters);

  return {
    success: true,
    summary: data || {}
  };
}


module.exports = {
  getCashbookDetailsService,
  getCashbookSummaryService
};