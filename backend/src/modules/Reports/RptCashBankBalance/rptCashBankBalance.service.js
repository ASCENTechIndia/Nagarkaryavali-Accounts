const repo = require("./rptCashBankBalance.repo");

async function getGrampanchayatListService(payload) {
  console.log("📥 Service: Fetch Grampanchayat List", payload);

  const data = await repo.getGrampanchayatListRepo(payload.deptId);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getCashBankBalanceReportService(payload) {
  console.log("📥 Service: Fetch Cash Bank Balance Report", payload);

  const data = await repo.getCashBankBalanceReportRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}
async function getDailyTransactionDetailedReportService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.date) {
    throw new AppError("Date is required", 400);
  }

  const data = await repo.getDailyTransactionDetailedReport(filters);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}



module.exports = {
  getGrampanchayatListService,
  getCashBankBalanceReportService,
  getDailyTransactionDetailedReportService
};