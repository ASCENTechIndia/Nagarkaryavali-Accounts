const repo = require("./FrmVoucherGeneration.repo");
const { AppError } = require("../../../libs/errors");

const getGLListService = () => repo.getGLList();
const getPartyListService = (body) => repo.getPartyList(body);
const getBalanceVoucherService = (body) => repo.getBalanceVoucherDetails(body);
const getVoucherPrepService = (body) => repo.getVoucherPrepList(body);
const getChequeBookService = (body) => repo.getChequeBook(body);
const getVoucherDetailsService = (body) => repo.getVoucherDetails(body);
const getVoucherTableDetailsService = async (data) => {
  const { voucher_no, corp_id } = data;

  if (!voucher_no || !corp_id) {
    throw new AppError("voucher_no and corp_id are required", 400);
  }

  const result = await repo.getVoucherTableDetails({
    voucher_no,
    corp_id,
  });

  return result;
};


async function voucherGenerationService(data) {
  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }

  const result = await repo.voucherGeneration(data);

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.message, 400);
  }

  return {
    success: true,
    errorCode: result.errorCode,
    errorMsg: result.message,
  };
}

const getVoucherTaxService = (body) => repo.getVoucherTaxDetails(body);

// ✅ Voucher Generation Service
async function voucherGenerationService(data) {
  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }

  const result = await repo.voucherGeneration(data);

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.message, 400);
  }

  return {
    success: true,
    errorCode: result.errorCode,
    errorMsg: result.message,
  };
}


async function getCounterVoucherService(body = {}) {
  const { refno, ulbId } = body;

  // ✅ Proper validation
  if (!refno) throw new AppError("Ref No required", 400);
  if (!ulbId) throw new AppError("ULB ID required", 400);

  // ✅ Fetch header
  const headerRes = await repo.getCounterVoucherHeader({
    refno,
    ulbId,
  });

  if (!headerRes.rows?.length) {
    throw new AppError("No voucher found", 404);
  }

  const header = headerRes.rows[0];

  // ⚠️ Critical safety check
  if (!header.TRANSNO) {
    throw new AppError("Invalid voucher data (missing TRANSNO)", 500);
  }

  // ✅ Fetch details
  const detailsRes = await repo.getCounterVoucherDetails({
    transno: header.TRANSNO,
    ulbId,
  });

  const details = detailsRes.rows || [];

  return {
    success: true,
    header,
    details,
    meta: {
      detailCount: details.length,
    },
  };
}

module.exports = {
  getGLListService,
  getPartyListService,
  getBalanceVoucherService,
  getVoucherPrepService,
  getChequeBookService,
  getVoucherDetailsService,
  getVoucherTableDetailsService,
  getVoucherTaxService,
  voucherGenerationService,
  getCounterVoucherService
};