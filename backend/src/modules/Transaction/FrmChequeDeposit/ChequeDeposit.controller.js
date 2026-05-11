const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./ChequeDeposit.service");

exports.getBankDepositSummary = asyncHandler(async (req, res) => {
  const result = await service.getBankDepositSummary(req.body);

  return ok(res, result);
});


exports.getBankDepositDetails = asyncHandler(async (req, res) => {
  const result = await service.getBankDepositDetails(req.body);

  return ok(res, result);
});


exports.getChequeDepositDetails = asyncHandler(async (req, res) => {
  const result = await service.getChequeDepositDetails(req.body);

  return ok(res, result);
});


exports.getZoneList = asyncHandler(async (req, res) => {
  const result = await service.getZoneList(req.params.zoneId);

  return ok(res, result);
});


exports.getCollectionCenterList = asyncHandler(async (req, res) => {
  const result = await service.getCollectionCenterList(
    req.params.prabhagId
  );

  return ok(res, result);
});

exports.saveCashierReceipt = asyncHandler(async (req, res) => {
  const result = await service.saveCashierReceipt(req.body);

  return ok(res, result);
});