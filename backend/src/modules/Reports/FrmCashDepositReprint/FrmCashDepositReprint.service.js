const repo = require("./FrmCashDepositReprint.repo");

async function getReceiptReportService(payload) {
  console.log("📥 Service: Fetch Receipt Report", payload);

  const data = await repo.getReceiptReportRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getPayModesService(payload) {
  console.log("📥 Service: Fetch Pay Modes", payload);

  const data = await repo.getPayModesRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

module.exports = {
  getReceiptReportService,
  getPayModesService,
};
