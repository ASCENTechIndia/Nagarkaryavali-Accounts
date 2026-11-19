const repo = require("./FrmBulkReceipt.repo");

async function getFrmBulkReceiptService(payload) {
  console.log("📥 Service: Fetch FrmBulkReceipt", payload);

  const data = await repo.getFrmBulkReceiptRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function searchBulkReceiptAccountService(payload) {
  console.log("📥 Service: Search Bulk Receipt Account", payload);

  const data = await repo.searchBulkReceiptAccountRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function bulkreceiptInsertUpdateService(data) {
  const result = await repo.bulkreceiptInsertUpdateRepo(data);

  if (!result || result.out_ErrorCode !== 0) {
    throw new AppError(result?.out_ErrorMsg || "Failed to save receipt", 500);
  }

  return {
    refNo: result.out_ReturnStr,
    message: result.out_ErrorMsg,
    errorCode: result.out_ErrorCode
  };
}

module.exports = {
  getFrmBulkReceiptService,
  searchBulkReceiptAccountService,
  bulkreceiptInsertUpdateService
};