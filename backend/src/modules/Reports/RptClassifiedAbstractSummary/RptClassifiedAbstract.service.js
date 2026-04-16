const repo = require("./RptClassifiedAbstract.repo");
const { AppError } = require("../../../libs/errors");

// Budget Expenditure Report
async function getBudgetExpenditureReportService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("FromDate and ToDate are required", 400);
  }

  if (!filters.rptType) {
    throw new AppError("Report Type (rptType) is required", 400);
  }

  const data = await repo.getBudgetExpenditureReport(filters);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

module.exports = {
  getBudgetExpenditureReportService,
};