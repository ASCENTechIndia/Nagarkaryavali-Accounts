const repo = require("./frmBanList.repo");

async function getBankListService() {
  console.log("📥 Service: Fetch Bank List");

  const data = await repo.getBankListRepo();

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getBankByIdService(payload) {
  console.log("📥 Service: Fetch Bank By ID", payload);

  const data = await repo.getBankByIdRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function saveBankService(payload) {
  console.log("📥 Service: Save Bank", payload);

  const result = await repo.saveBankRepo(payload);

  return {
    success: result.out_ErrorCode === -100,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
  };
}

module.exports = {
  getBankListService,
  getBankByIdService,
  saveBankService,
};
