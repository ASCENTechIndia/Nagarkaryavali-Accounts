const repo = require("./chequeBookMst.repo");

async function getUserDetailsService(payload) {
  console.log("📥 Service: Fetch User Details", payload);

  const data = await repo.getUserDetailsRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getNextChequeBookNoService(payload) {
  console.log("📥 Service: Fetch Next Cheque Book Number", payload);

  const data = await repo.getNextChequeBookNoRepo(payload);

  return {
    success: true,
    data: data[0] || {},
  };
}


async function saveChequeBookService(payload) {
  console.log("📥 Service: Save Cheque Book", payload);

  const result = await repo.saveChequeBookRepo(payload);

  return {
    success: result.out_ErrorCode === -100,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
  };
}

module.exports = {
  getUserDetailsService,
  getNextChequeBookNoService, 
  saveChequeBookService
};
