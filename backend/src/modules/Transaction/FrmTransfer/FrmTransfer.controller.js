const { ok } = require("../../../libs/response");
const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./FrmTransfer.service");

const getTransactionTypes = asyncHandler(async (req, res) => {
  const data = await service.getTransactionTypesService();
  return ok(res, data);
});

const getDepartments = asyncHandler(async (req, res) => {
  const data = await service.getDepartmentsService();
  return ok(res, data);
});

const getGLCodes = asyncHandler(async (req, res) => {
  const data = await service.getGLCodesService();
  return ok(res, data);
});

const getBudgetHeads = asyncHandler(async (req, res) => {
  const data = await service.getBudgetHeadsService();
  return ok(res, data);
});

const getPartyList = asyncHandler(async (req, res) => {
  const { corpId } = req.body;
  const data = await service.getPartyListService(corpId);
  return ok(res, data);
});

const getContraDetails = asyncHandler(async (req, res) => {
  const { tranRef } = req.body;
  const data = await service.getContraDetailsService(tranRef);
  return ok(res, data);
});

const getTransferList = asyncHandler(async (req, res) => {
  const { zoneId, ulbId } = req.body;
  const data = await service.getTransferListService(zoneId, ulbId);
  return ok(res, data);
});

const transferInsertUpdate = asyncHandler(async (req, res) => {
  const { userId, paramStr, paramStr2 } = req.body;

  const result = await service.transferInsertUpdateService({
    userId,
    paramStr,
    paramStr2
  });

  return ok(res, result);
});


const creditLeasure = asyncHandler(async (req, res) => {
  const { corp_id, glcode } = req.body;
  const data = await service.creditLeasureService(corp_id, glcode);
  return ok(res, data);
});

module.exports = {
  getTransactionTypes,
  getDepartments,
  getGLCodes,
  getBudgetHeads,
  getPartyList,
  getContraDetails,
  getTransferList,
  transferInsertUpdate,
  creditLeasure
};