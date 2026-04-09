const asyncHandler = require("../libs/asyncHandler");
const { ok } = require("../libs/response");
const service = require("./utils.service");
const { ipToNumber } = require("../libs/ipToNumber");

exports.getUserTypeList = asyncHandler(async (req, res) => {
  const data = await service.fetchUserTypeList();
  return ok(res, data);
});

exports.getCollCenterList = asyncHandler(async (req, res) => {
  const data = await service.fetchCollCenterList();
  return ok(res, data);
});

 exports.getPrabhagList = asyncHandler(async (req, res) => {
   const data = await service.fetchPrabhagList();
   return ok(res, data);
 });
 
 
 exports.getPrabhagById = asyncHandler(async (req, res) => {
   const { prabhagId } = req.params;
   const data = await service.fetchPrabhagById(Number(prabhagId));
   return ok(res, data);
 });
 
 exports.getReceiptModeList = asyncHandler(async (req, res) => {
   const data = await service.fetchReceiptModeList();
   return ok(res, data);
 });
 
 
 exports.getBankReceiptList = asyncHandler(async (req, res) => {
   const data = await service.fetchBankReceiptList();
   return ok(res, data);
 });
 exports.getReceiptTypes = asyncHandler(async (req, res) => {
   const data = await service.fetchReceiptTypes();
   return ok(res, data);
 });
 
 exports.getZonesByPrabhag = asyncHandler(async (req, res) => {
   const { prabhagId } = req.params;
   const data = await service.fetchZonesByPrabhag(Number(prabhagId));
   return ok(res, data);
 });
 
 exports.getWardsByZone = asyncHandler(async (req, res) => {
   const { zoneId } = req.params;
   const data = await service.fetchWardsByZone(Number(zoneId));
   return ok(res, data);
 });
 exports.getWardsByPrabhag = asyncHandler(async (req, res) => {
   const { prabhagId } = req.params;
   const data = await service.fetchWardsByPrabhag(Number(prabhagId));
   return ok(res, data);
 });
 
 exports.getYears = asyncHandler(async (req, res) => {
  const data = await service.fetchYears();
  return ok(res, data);
});
  
exports.getAllUsers = asyncHandler(async (req, res) => {
  const data = await service.getAllUsers();
  return ok(res, data);
});


exports.getPrabhagByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const data = await service.fetchPrabhagByUser(userId);
  return ok(res, data);
});

exports.getZonesByPrabhagAndUser = asyncHandler(async (req, res) => {
  const { prabhagId, userId } = req.query;

  const data = await service.fetchZonesByPrabhagAndUser(
    prabhagId ? Number(prabhagId) : null,
    userId || null
  );

  return ok(res, data);
});

exports.getWardsByZoneAndUser = asyncHandler(async (req, res) => {
  const { zoneId, userId } = req.params;

  const data = await service.fetchWardsByZoneAndUser(
    Number(zoneId),
    userId
  );

  return ok(res, data);
});


exports.getSubwardList = asyncHandler(async (req, res) => {
  const data = await service.fetchSubwardList();
  return ok(res, data);
});