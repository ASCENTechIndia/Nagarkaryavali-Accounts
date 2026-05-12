const repo = require("./frmSDRef.repo");

async function searchPartiesConcatenatedService(payload) {
  const data = await repo.searchPartiesConcatenated(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function searchPartiesStandardService(payload) {
  const data = await repo.searchPartiesStandard(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getSdRefundListService(payload) {
  const data = await repo.getSdRefundList(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getCreditGLMasterService() {
  const data = await repo.getCreditGLMaster();

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getDebitGLMasterService() {
  const data = await repo.getDebitGLMaster();

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function checkRefundStatusService(payload) {
  const data = await repo.checkRefundStatus(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getVoucherBySDIDService(payload) {
  const data = await repo.getVoucherBySDID(payload.sdid);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getSDVoucherMasterService(payload) {
  const data = await repo.getSDVoucherMaster(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getPartyBankDetailsService(payload) {
  const data = await repo.getPartyBankDetails(
    payload.partyBankId,
    payload.ulbId
  );

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getSDVoucherDetailsService(payload) {
  const data = await repo.getSDVoucherDetails(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getVoucherPrepMasterService(payload) {
  const data = await repo.getVoucherPrepMaster(
    payload.refNo,
    payload.ulbId
  );

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getGeneralBankDetailsService(payload) {
  const data = await repo.getGeneralBankDetails(payload.partyBankId);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getSDUpdatedDetailsService(payload) {
  const data = await repo.getSDUpdatedDetails(
    payload.refNo,
    payload.ulbId
  );

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getSDAccountSubtypeService(payload) {
  const data = await repo.getSDAccountSubtype(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getPartyBankListService(payload) {
  const data = await repo.getPartyBankList(payload.partyId);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getBudgetBalanceService(payload) {
  const data = await repo.getBudgetBalance(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getPartyTaxDetailsService(payload) {
  const data = await repo.getPartyTaxDetails(
    payload.partyId,
    payload.ulbId
  );

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getSDVoucherPrepReceiptDetailsService(payload) {
  const data = await repo.getSDVoucherPrepReceiptDetails(
    payload.voucherNo,
    payload.ulbId
  );

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getSDReferenceInfoService(payload) {
  const data = await repo.getSDReferenceInfo(
    payload.sdid,
    payload.ulbId
  );

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function saveSdRefundVoucherService(payload) {
  const result = await repo.saveSdRefundVoucherRepo(payload);

  return {
    success: result.out_ErrorCode === -100,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
    refno: result.out_ReturnStr,
  };
}


async function getNextCertificateNo(
  ulbId
) {
  if (!ulbId) {
    throw new Error(
      "ULB ID is required"
    );
  }

  const maxcertino =
    await repo.getNextCertificateNoRepo(
      ulbId
    );

  return {
    success: true,
    maxcertino,
  };
}


module.exports = {
  searchPartiesConcatenatedService,
  searchPartiesStandardService,
  getSdRefundListService,
  getCreditGLMasterService,
  getDebitGLMasterService,
  checkRefundStatusService,
  getVoucherBySDIDService,
  getSDVoucherMasterService,
  getPartyBankDetailsService,
  getSDVoucherDetailsService,
  getVoucherPrepMasterService,
  getGeneralBankDetailsService,
  getSDUpdatedDetailsService,
  getSDAccountSubtypeService,
  getPartyBankListService,
  getBudgetBalanceService,
  getPartyTaxDetailsService,
  getSDVoucherPrepReceiptDetailsService,
  getSDReferenceInfoService,
  saveSdRefundVoucherService,
  getNextCertificateNo
};