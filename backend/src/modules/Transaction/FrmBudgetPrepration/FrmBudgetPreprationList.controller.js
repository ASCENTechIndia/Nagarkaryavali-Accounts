const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmBudgetPreprationList.service");

// Get Accounts
exports.getAccountBySubType = asyncHandler(async (req, res) => {
  const { subTypeId } = req.query;

  const data = await service.getAccountBySubTypeService(subTypeId);

  return ok(res, data, "Account list fetched");
});

// Procedure
exports.budgetPreparation = asyncHandler(async (req, res) => {
  const data = await service.budgetPreparationService(req.body);

  return ok(res, data, data.message);
});

exports.getAccSubTypeList = asyncHandler(async (req, res) => {
  const data = await service.getAccSubTypeListService();

  return ok(res, data, "Account subtype list fetched");
});