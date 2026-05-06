const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmCheqCancelchanges.service");

exports.getChequeCancelDetails = asyncHandler(async (req, res) => {
  const data = await service.getChequeCancelDetailsService(req.body);
  return ok(res, data, "Cheque cancel details fetched successfully");
});

exports.getChequeCancelDetailsAuto = asyncHandler(async (req, res) => {
  const data = await service.getChequeCancelDetailsServiceAuto(req.body);
  return ok(res, data, "Cheque cancel details fetched successfully");
});


exports.insertCheqCancel = asyncHandler(async (req, res) => {
  const data = await service.insertCheqCancelService(req.body);
  return ok(res, data, "Cheque cancel procedure executed successfully");
});
