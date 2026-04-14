const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmContract.service");

exports.getZones = asyncHandler(async (req, res) => {
  const { ulbId } = req.query;

  const data = await service.getZonesService(ulbId);

  return ok(res, data, "Zones fetched successfully");
});

exports.getContractList = asyncHandler(async (req, res) => {
  const { zoneId, ulbId } = req.query;

  const data = await service.getContractListService(zoneId, ulbId);

  return ok(res, data, "Contract list fetched successfully");
});

exports.getContractById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const data = await service.getContractByIdService(id);

  return ok(res, data, "Contract details fetched successfully");
});

exports.getContractDetails = asyncHandler(async (req, res) => {
  const { contractId } = req.params;

  const data = await service.getContractDetailsService(contractId);

  return ok(res, data, "Contract details fetched successfully");
});

exports.searchGL = asyncHandler(async (req, res) => {
  const { functioncode, ulbId, searchText } = req.query;

  const data = await service.searchGLService(functioncode, ulbId, searchText);

  return ok(res, data, "GL codes fetched successfully");
});

exports.searchContractor = asyncHandler(async (req, res) => {
  const { searchText, ulbId } = req.query;

  const data = await service.searchContractorService(searchText, ulbId);

  return ok(res, data, "Contractors fetched successfully");
});


exports.contractMaster = asyncHandler(async (req, res) => {
  console.log("Received request body:", req.body);
  
  const data = await service.contractMasterService(req.body);
  
  console.log("Service response:", data);
  
  return res.status(200).json({
    success: data.success,
    message: data.message,
    data: data
  });
});