const { AppError } = require("../../../libs/errors");
const repo = require("./frmPayment.repo");

async function getFrmPaymentService(payload) {
    console.log("📥 Service: Fetch FrmPayment", payload);

    const data = await repo.getFrmPaymentRepo(payload);

    return {
        success: true,
        count: data.length,
        data,
    };
}

async function getTransactionTypeService() {
    console.log("📥 Service: Fetch Transaction Types");

    const data = await repo.getTransactionTypeRepo();

    return {
        success: true,
        count: data.length,
        data,
    };
}

async function getPartyMasterService(payload) {
    console.log("📥 Service: Fetch Party Master", payload);

    const data = await repo.getPartyMasterRepo(payload);

    return {
        success: true,
        count: data.length,
        data,
    };
}

async function getAccountDetailsService(payload) {
    console.log("📥 Service: Fetch Account Details", payload);

    const data = await repo.getAccountDetailsRepo(payload);

    return {
        success: true,
        count: data.length,
        data,
    };
}

async function getSecurityDepositService(payload) {
    console.log("📥 Service: Fetch Security Deposit", payload);

    const data = await repo.getSecurityDepositRepo(payload);

    return {
        success: true,
        count: data.length,
        data,
    };
}

async function getPaymentTypesService() {
    console.log("📥 Service: Fetch Payment Types");

    const data = await repo.getPaymentTypesRepo();

    return {
        success: true,
        count: data.length,
        data,
    };
}

async function getAdvancePaymentTypeService() {
    console.log("📥 Service: Fetch Advance Payment Type");

    const data = await repo.getAdvancePaymentTypeRepo();

    return {
        success: true,
        count: data.length,
        data,
    };
}

async function getPaymentDetailsService(payload) {
    console.log("📥 Service: Fetch Payment Details", payload);

    const data = await repo.getPaymentDetailsRepo(payload);

    return {
        success: true,
        count: data.length,
        data,
    };
}

// async function searchAccountService(payload) {
//     console.log("📥 Service: Search Account", payload);

//     const data = await repo.searchAccountRepo(payload);

//     return {
//         success: true,
//         count: data.length,
//         data,
//     };
// }

async function searchAccountService(payload) {
  console.log("📥 Service Payload:", payload);

  const data = await repo.getAccountBalanceRepo({
    targetDate: payload.targetDate,
    corpId: payload.corpId,
    ulbid: payload.ulbid,
    glcode: payload.glcode,   // ✅ REQUIRED
    accno: payload.accno      // ✅ REQUIRED
  });

  return {
    success: true,
    data,
  };
}

async function getAccountBalanceService(payload) {
    const row = await repo.getAccountBalanceRepo(payload);
    return { success: true, data: row };
}

async function getCorporationByIdService(payload) {
    console.log("📥 Service: Fetch Corporation", payload);

    const data = await repo.getCorporationByIdRepo(payload);

    return {
        success: true,
        count: data.length,
        data,
    };
}

async function getPaymentDetailsViewService(payload) {
  console.log("📥 Service: Fetch Payment Details View", payload);

  const data = await repo.getPaymentDetailsViewRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function savePaymentService(payload) {
  console.log("📥 Service: Save Payment", payload);

  const result = await repo.savePaymentRepo(payload);
    console.log("object",result)
  return {
    success: result.out_ErrorCode === -100,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
    refno: result.out_ReturnStr,
  };
}


async function getPaymentDetailsServicePDF(payload) {
  const { refno, ulbid } = payload;

  if (!refno) throw new AppError("refno is required", 400);
  if (!ulbid) throw new AppError("ulbid is required", 400);

  const result = await repo.getPaymentDetailsPDF(refno, ulbid);

  if (!result.rows.length) {
    throw new AppError("No data found", 404);
  }

  return result.rows;
}



module.exports = {
    getFrmPaymentService,
    getTransactionTypeService,
    getPartyMasterService,
    getAccountDetailsService,
    getSecurityDepositService,
    getPaymentTypesService,
    getAdvancePaymentTypeService,
    getPaymentDetailsService,
    searchAccountService,
    getAccountBalanceService,
    getCorporationByIdService,
    getPaymentDetailsViewService,
    savePaymentService,
    getPaymentDetailsServicePDF
};