const repo = require("./frmContraRecReprint.repo");

async function getContraReceiptListService(payload) {
  console.log("📥 Service: Fetch Contra Receipt Reprint", payload);

  const data = await repo.getContraReceiptListRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getPaymentReprintListService(payload) {
  const data = await repo.getPaymentReprintListRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

module.exports = {
  getContraReceiptListService,
  getPaymentReprintListService
};