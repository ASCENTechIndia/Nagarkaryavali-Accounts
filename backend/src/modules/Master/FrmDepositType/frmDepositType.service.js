const repo = require("./frmDepositType.repo");

async function getDepositTypeService(payload) {
  console.log("📥 Service: Fetch Deposit Types", payload);

  const data = await repo.getDepositTypeRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getDepositTypeByIdService(payload) {
  console.log("📥 Service: Fetch Deposit Type By ID", payload);

  const data = await repo.getDepositTypeByIdRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function saveDepositTypeService(payload) {
  console.log("📥 Service: Save Deposit Type", payload);

  const result = await repo.saveDepositTypeRepo(payload);

  return {
    success: result.out_ErrorCode === -100,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
  };
}


module.exports = {
  getDepositTypeService,
  getDepositTypeByIdService,
  saveDepositTypeService, 
};
