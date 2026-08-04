const repo = require("./FrmVoucherAuth.repo");


async function getVoucherAuthListService(payload) {
  console.log("📥 Service: Fetch Voucher Approval List", payload);
  const data = await repo.getVoucherAuthListRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getVoucherAuthByIdService(payload) {
  console.log("📥 Service: Fetch Voucher Detail", payload);
  const data = await repo.getVoucherAuthByIdRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function saveVoucherApprovalService(payload) {
  console.log("📥 Service: Voucher Approval", payload);
  const result = await repo.saveVoucherApprovalRepo(payload);

  return {
    success: result.out_ErrorCode === -100,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
  };
}

module.exports = {
  getVoucherAuthListService,
  getVoucherAuthByIdService,
  saveVoucherApprovalService,
};