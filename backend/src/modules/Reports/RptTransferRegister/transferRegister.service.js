const repo = require("./transferRegister.repo");

async function getTransTypeService() {
  console.log("📥 Service: Fetch Transfer Register");

  const data = await repo.getTransTypeRepo();

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getTransactionRegisterReportService(payload) {
  console.log("📥 Service: Fetch Transaction Register Report", payload);

  const data = await repo.getTransactionRegisterReportRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

module.exports = {
  getTransTypeService,
  getTransactionRegisterReportService,
};