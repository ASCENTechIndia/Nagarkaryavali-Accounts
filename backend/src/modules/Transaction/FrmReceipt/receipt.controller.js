const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./receipt.service");


// ================= 1. Receipt List =================
exports.getReceiptList = asyncHandler(async (req, res) => {
  const data = await service.getReceiptList(req.body);
  return ok(res, data);
});


// ================= 2. Zones =================
exports.getZones = asyncHandler(async (req, res) => {
  const data = await service.getZones(req.body);
  return ok(res, data);
});


// ================= 3. Corporation =================
exports.getCorporation = asyncHandler(async (req, res) => {
  const data = await service.getCorporation(req.body);
  return ok(res, data);
});


// ================= 4. Departments =================
exports.getDepartments = asyncHandler(async (req, res) => {
  const data = await service.getDepartments(req.body);
  return ok(res, data);
});


// ================= 5. Narration =================
exports.getNarration = asyncHandler(async (req, res) => {
  const data = await service.getNarration();
  return ok(res, data);
});


// ================= 6. Transaction Type =================
exports.getTransType = asyncHandler(async (req, res) => {
  const data = await service.getTransType();
  return ok(res, data);
});


// ================= 7. Receipt Details =================
exports.getReceiptDetails = asyncHandler(async (req, res) => {
  const data = await service.getReceiptDetails(req.body);
  return ok(res, data);
});


// ================= 8. Party =================
exports.getParty = asyncHandler(async (req, res) => {
  const data = await service.getParty(req.body);
  return ok(res, data);
});


// ================= 9. Search GL =================
exports.searchGL = asyncHandler(async (req, res) => {
  const data = await service.searchGL();
  return ok(res, data);
});

exports.searchGLALL = asyncHandler(async (req, res) => {
  const data = await service.searchGLALL();
  return ok(res, data);
});


// ================= 10. Insert / Update Receipt =================
exports.receiptInsertUpdate = asyncHandler(async (req, res) => {
  const data = await service.receiptInsertUpdate(req.body);
  return ok(res, data);
});

exports.getBudgetHeads = asyncHandler(async (req, res) => {
  const data = await service.getBudgetHeads();
  return ok(res, data);
});