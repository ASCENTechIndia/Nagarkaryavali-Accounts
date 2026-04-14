const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FromBankbranch.service");

exports.getBankList = asyncHandler(async (req, res) => {
  const data = await service.getBankListService();
  return ok(res, data, "Bank list fetched");
});

exports.getBranchList = asyncHandler(async (req, res) => {
  const { bankId } = req.query;
  const data = await service.getBranchListService(bankId);
  return ok(res, data, "Branch list fetched");
});

exports.getBranchById = asyncHandler(async (req, res) => {
  const branchId = req.params.id;
  const data = await service.getBranchByIdService(branchId);
  return ok(res, data, "Branch details fetched");
});

exports.bankBranchMaster = asyncHandler(async (req, res) => {
  const data = await service.bankBranchService(req.body);
  return ok(res, data, data.message);
});