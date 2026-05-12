const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./frmContraRecReprint.service");

exports.getContraReceiptList = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { fromDate, toDate, ulbId } = req.body;

  if (!fromDate) {
    throw new AppError("fromDate is required", 400);
  }

  if (!toDate) {
    throw new AppError("toDate is required", 400);
  }

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const payload = {
    fromDate,
    toDate,
    ulbId,
  };

  const data = await service.getContraReceiptListService(payload);

  return ok(res, data, "Contra Receipt Reprint fetched successfully");
});

exports.getPaymentReprintList = asyncHandler(async (req, res) => {
  const { fromDate, toDate, ulbid } = req.body;

  if (!fromDate) {
    throw new AppError("fromDate is required", 400);
  }

  if (!toDate) {
    throw new AppError("toDate is required", 400);
  }

  if (!ulbid) {
    throw new AppError("ulbid is required", 400);
  }

  const data = await service.getPaymentReprintListService({
    fromDate,
    toDate,
    ulbid,
  });

  return ok(res, data, "Payment Reprint fetched successfully");
});