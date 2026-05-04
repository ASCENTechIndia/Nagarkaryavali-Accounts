const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./BankDepositReports.service");

exports.getDepartments = asyncHandler(async (req, res) => {
  const { ulbId } = req.query;
  const data = await service.getDepartmentsService(ulbId);
  return ok(res, data, "Departments fetched");
});

exports.getSummary = asyncHandler(async (req, res) => {
  const data = await service.getSummaryService(req.body);
  return ok(res, data, "Summary report fetched");
});

exports.getAccountWise = asyncHandler(async (req, res) => {
  const data = await service.getAccountWiseService(req.body);
  return ok(res, data, "Account wise report fetched");
});

exports.getChallan = asyncHandler(async (req, res) => {
  const data = await service.getChallanService(req.body);
  return ok(res, data, "Challan report fetched");
});

exports.searchGL = asyncHandler(async (req, res) => {
  const { prefix } = req.query;
  const data = await service.searchGLService(prefix);
  return ok(res, data, "GL search fetched");
});

exports.insertCashierReceipt = asyncHandler(async (req, res) => {
  const data = req.body;

  const result = await service.insertCashierReceiptService(data);

  return ok(res, result, result.message);
});

exports.getZoneDropdown = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getZoneDropdownService(filters);

  return ok(res, data, "Dropdown data fetched");
});