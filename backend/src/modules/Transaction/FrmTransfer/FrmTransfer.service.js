const { AppError } = require("../../../libs/errors");
const repo = require("./FrmTransfer.repo");

const getTransactionTypesService = async () => {
  return await repo.getTransactionTypes();
};

const getDepartmentsService = async () => {
  return await repo.getDepartments();
};

const getGLCodesService = async () => {
  return await repo.getGLCodes();
};

const getBudgetHeadsService = async () => {
  return await repo.getBudgetHeads();
};

const getPartyListService = async (corpId) => {
  if (!corpId) throw new AppError("corpId is required", 400);
  return await repo.getPartyList(corpId);
};

const getContraDetailsService = async (tranRef) => {
  if (!tranRef) throw new AppError("tranRef is required", 400);
  return await repo.getContraDetails(tranRef);
};

const getTransferListService = async (zoneId, ulbId) => {
  if (!zoneId || !ulbId) {
    throw new AppError("zoneId and ulbId are required", 400);
  }
  return await repo.getTransferList(zoneId, ulbId);
};


const transferInsertUpdateService = async (payload) => {
  const { userId, paramStr, paramStr2 } = payload;

  if (!userId || !paramStr || !paramStr2) {
    throw new AppError("userId, paramStr and paramStr2 are required", 400);
  }

  const result = await repo.transferInsertUpdate(userId, paramStr, paramStr2);

  return {
    success: result.errorCode === -100,
    ...result,
  };
};

const creditLeasureService = async (corp_id, glcode) => {
  if (!corp_id || !glcode) {
    throw new AppError("corp_id and glcode are required", 400);
  }
  return await repo.creditLeasure(corp_id, glcode);
};

const getCounterVoucherService = async (body = {}) => {
  const { refno, ulbId } = body;

  if (!refno) throw new AppError("Ref No required", 400);

  const result = await repo.getCounterVoucher(body);

  console.log("Counter Voucher Result:", result); // Debug log

  return {
    success: true,
    rows: result.rows,
    rowCount: result.rows.length,
  };
};

module.exports = {
  getTransactionTypesService,
  getDepartmentsService,
  getGLCodesService,
  getBudgetHeadsService,
  getPartyListService,
  getContraDetailsService,
  getTransferListService,
  transferInsertUpdateService,
  creditLeasureService,
  getCounterVoucherService
};
