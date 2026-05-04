const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("../FrmSdRefundRpt/FrmSdRefundRpt.Service");

exports.getPartySearch1 = asyncHandler(async (req, res) => {
  const data = await service.getPartySearch1Service(req.body);
  return ok(res, data, "Party search (query 1) fetched successfully");
});

exports.getPartySearch2 = asyncHandler(async (req, res) => {
  const data = await service.getPartySearch2Service(req.body);
  return ok(res, data, "Party search (query 2) fetched successfully");
});

exports.getSDReceivedPaid = asyncHandler(async (req, res) => {
  const data = await service.getSDReceivedPaidService(req.body);
  return ok(res, data, "SD Received/Paid fetched successfully");
});
