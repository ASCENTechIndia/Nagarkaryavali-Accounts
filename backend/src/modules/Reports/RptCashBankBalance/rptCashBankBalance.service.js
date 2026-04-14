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



module.exports = {
  getGrampanchayatListService,
  getCashBankBalanceReportService
};