const repo = require("./FrmVoucherGeneration.repo");

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

module.exports = {
  getGLListService,
  getPartyListService,
  getBalanceVoucherService,
  getVoucherPrepService,
  getChequeBookService,
  getVoucherDetailsService,
  getVoucherTableDetailsService,
  getVoucherTaxService,
  voucherGenerationService
};