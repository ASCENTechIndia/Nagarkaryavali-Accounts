const repo = require("./FrmVouchergenerationReprint.repo");

async function getVoucherGenerationReprintService(payload) {
  console.log("📥 Service: Fetch Voucher Generation Reprint", payload);

  const data = await repo.getVoucherGenerationReprintRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getVoucherGenerationPrintService(payload) {
  console.log("📥 Service: Fetch Voucher Generation Print", payload);

  const data = await repo.getVoucherGenerationPrintRepo(payload);

  return {
    success: true,
    count: data.mainData.length,
    data,
  };
}

module.exports = {
  getVoucherGenerationReprintService,

  getVoucherGenerationPrintService,
};
