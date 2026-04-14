const asyncHandler = require("../../libs/asyncHandler");
const { ok } = require("../../libs/response");
const service = require("./receipt.service");

// ================= APIs =================

exports.getReceiptList = asyncHandler(async (req, res) => {
  const data = await service.getReceiptList(req.body);
  return ok(res, data);
});

exports.getZones = asyncHandler(async (req, res) => {
  const data = await service.getZones(req.body);
  return ok(res, data);
});

exports.getCorporation = asyncHandler(async (req, res) => {
  const data = await service.getCorporation(req.body);
  return ok(res, data);
});

exports.getDepartments = asyncHandler(async (req, res) => {
  const data = await service.getDepartments(req.body);
  return ok(res, data);
});

exports.getBudgetHeads = asyncHandler(async (req, res) => {
  const data = await service.getBudgetHeads();
  return ok(res, data);
});

exports.getNarration = asyncHandler(async (req, res) => {
  const data = await service.getNarration();
  return ok(res, data);
});

exports.getTransType = asyncHandler(async (req, res) => {
  const data = await service.getTransType();
  return ok(res, data);
});

exports.getDeptMaster = asyncHandler(async (req, res) => {
  const data = await service.getDeptMaster();
  return ok(res, data);
});

exports.getReceiptDetails = asyncHandler(async (req, res) => {
  const data = await service.getReceiptDetails(req.body);
  return ok(res, data);
});

exports.getGrampanch = asyncHandler(async (req, res) => {
  const data = await service.getGrampanch(req.body);
  return ok(res, data);
});

exports.getParty = asyncHandler(async (req, res) => {
  const data = await service.getParty(req.body);
  return ok(res, data);
});

exports.getAccountName = asyncHandler(async (req, res) => {
  const data = await service.getAccountName(req.body);
  return ok(res, data);
});

// ================= PROCEDURE =================

exports.receiptInsertUpdate = asyncHandler(async (req, res) => {
  const data = await service.receiptInsertUpdate(req.body);
  return ok(res, data);
});