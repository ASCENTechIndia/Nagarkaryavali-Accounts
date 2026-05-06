const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./FrmBulkReceipt.service");

exports.getFrmBulkReceipt = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { challanNo, deptId, ulbId } = req.body;
  if (!challanNo) {
    throw new AppError("challanNo is required", 400);
  }
  if (!deptId) {
    throw new AppError("deptId is required", 400);
  }
  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const payload = {
    challanNo,
    deptId,
    ulbId,
  };

  const data = await service.getFrmBulkReceiptService(payload);
  return ok(res, data, "FrmBulkReceipt fetched successfully");
});

exports.searchBulkReceiptAccount = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { glcode, accno, ulbid } = req.body;
  if (!ulbid) {
    throw new AppError("ulbid is required", 400);
  }
  // At least one required
  if (!glcode && !accno) {
    throw new AppError(
      "Either glcode or accno is required",
      400
    );
  }

  const payload = {
    glcode,
    accno,
    ulbid,
  };

  const data = await service.searchBulkReceiptAccountService(payload);
  return ok(
    res,
    data,
    "Bulk receipt accounts fetched successfully"
  );
});