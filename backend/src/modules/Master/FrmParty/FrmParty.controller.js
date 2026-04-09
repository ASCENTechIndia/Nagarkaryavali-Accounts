const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmParty.service");

exports.getCorporationList = asyncHandler(async (req, res) => {
  const data = await service.getCorporationListService();
  return ok(res, data, "Corporation list fetched");
});

exports.searchParty = asyncHandler(async (req, res) => {
  const { partyId, corpId } = req.query;

  const data = await service.searchPartyService(partyId, corpId);

  return ok(res, data, "Party list fetched");
});

exports.getPartyById = asyncHandler(async (req, res) => {
  const partyId = req.params.id;

  const data = await service.getPartyByIdService(partyId);

  return ok(res, data, "Party details fetched");
});

exports.getPartyBankDetails = asyncHandler(async (req, res) => {
  const partyId = req.params.id;

  const data = await service.getPartyBankDetails(partyId);

  return ok(res, data, "Bank details fetched");
});

exports.getPincodeList = asyncHandler(async (req, res) => {
  const { corpId } = req.query;

  const data = await service.getPincodeListService(corpId);

  return ok(res, data, "Pincode list fetched");
});

exports.getIFSCList = asyncHandler(async (req, res) => {
  const { corpId } = req.query;

  const data = await service.getIFSCListService(corpId);

  return ok(res, data, "IFSC list fetched");
});

exports.getStateList = asyncHandler(async (req, res) => {
  const data = await service.getStateListService();
  return ok(res, data, "State list fetched");
});

exports.getDistrictByState = asyncHandler(async (req, res) => {
  const stateId = req.params.stateId;

  const data = await service.getDistrictByStateService(stateId);

  return ok(res, data, "District list fetched");
});

exports.getCityByDistrict = asyncHandler(async (req, res) => {
  const districtId = req.params.districtId;

  const data = await service.getCityByDistrictService(districtId);

  return ok(res, data, "City list fetched");
});

exports.getBankList = asyncHandler(async (req, res) => {
  const data = await service.getBankListService();
  return ok(res, data, "Bank list fetched");
});

exports.getBranchByBank = asyncHandler(async (req, res) => {
  const bankId = req.params.bankId;

  const data = await service.getBranchByBankService(bankId);

  return ok(res, data, "Branch list fetched");
});

exports.getIFSCByBranch = asyncHandler(async (req, res) => {
  const branchId = req.params.branchId;

  const data = await service.getIFSCByBranchService(branchId);

  return ok(res, data, "IFSC fetched");
});

exports.partyMaster = asyncHandler(async (req, res) => {
  const data = await service.partyMasterService(req.body);
  return ok(res, data, data.message);
});