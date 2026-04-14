const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./chequeBookMst.service");

exports.getUserDetails = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { ulbId, userId } = req.body;

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }
  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  const payload = { ulbId, userId };

  const data = await service.getUserDetailsService(payload);

  return ok(res, data, "User details fetched successfully");
});

exports.getNextChequeBookNo = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { glCode, accNo, ulbId } = req.body;

  if (!glCode) throw new AppError("glCode is required", 400);
  if (!accNo) throw new AppError("accNo is required", 400);
  if (!ulbId) throw new AppError("ulbId is required", 400);

  const payload = { glCode, accNo, ulbId };

  const data = await service.getNextChequeBookNoService(payload);

  return ok(res, data, "Next cheque book number fetched successfully");
});

exports.saveChequeBook = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const {
    empName,
    glCode,
    bankAcc,
    chqNoFrom,
    chqNoTo,
    totalChq,
    userId,
    chqBookNo,
    zoneId,
    empId,
  } = req.body;

  // 🔥 Validations
  if (!userId) throw new AppError("userId is required", 400);
  if (!glCode) throw new AppError("glCode is required", 400);
  if (!bankAcc) throw new AppError("bankAcc is required", 400);
  if (!chqNoFrom) throw new AppError("chqNoFrom is required", 400);
  if (!chqNoTo) throw new AppError("chqNoTo is required", 400);

  const payload = {
    empName,
    glCode,
    bankAcc,
    chqNoFrom,
    chqNoTo,
    totalChq,
    userId,
    chqBookNo,
    zoneId,
    empId,
  };

  const data = await service.saveChequeBookService(payload);

  return ok(res, data, "Cheque book saved successfully");
});