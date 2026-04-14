const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmBudgetLIst.service");

exports.getBudgetList = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;
  const data = await service.getBudgetListService(fromDate, toDate);
  return ok(res, data, "Budget list fetched");
});

exports.getGLList = asyncHandler(async (req, res) => {
  const data = await service.getGLListService();
  return ok(res, data, "GL list fetched");
});

exports.getBudgetHeadList = asyncHandler(async (req, res) => {
  const data = await service.getBudgetHeadListService();
  return ok(res, data, "Budget head list fetched");
});

exports.getBudgetById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await service.getBudgetByIdService(id);
  return ok(res, data, "Budget details fetched");
});

exports.searchGL = asyncHandler(async (req, res) => {
  const { prefix } = req.query;
  const data = await service.searchGLService(prefix);
  return ok(res, data, "GL search fetched");
});

exports.budgetMaster = asyncHandler(async (req, res) => {
  const data = await service.budgetService(req.body);
  return ok(res, data, data.message);
});