const repo = require("./FrmConsolidatedReceipt.repo");

async function getConsolidatedReceiptService(payload) {
  console.log("📥 Service: Fetch Consolidated Receipt", payload);

  const data = await repo.getConsolidatedReceiptRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

module.exports = {
  getConsolidatedReceiptService,
};