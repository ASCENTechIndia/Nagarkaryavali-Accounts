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


module.exports = {
  getFrmBulkReceiptService,
  searchBulkReceiptAccountService
};