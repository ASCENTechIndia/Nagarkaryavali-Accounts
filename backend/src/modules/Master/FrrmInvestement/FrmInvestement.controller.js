const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmInvestement.service");

// List
exports.getInvestmentList = asyncHandler(async (req, res) => {
  const data = await service.getInvestmentListService();
  return ok(res, data, "Investment list fetched");
});

// By ID
exports.getInvestmentById = asyncHandler(async (req, res) => {
  const investId = req.params.id;

  const data = await service.getInvestmentByIdService(investId);

  return ok(res, data, "Investment details fetched");
});

// Procedure
exports.investmentMaster = asyncHandler(async (req, res) => {
  const data = await service.investmentService(req.body);
  return ok(res, data, data.message);
});