const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmInterestRtMst.service");
const { AppError } = require("../../../libs/errors");

// ============================================
// GET INTEREST LIST
// ============================================

exports.getInterestList = asyncHandler(async (req, res) => {
  const ulbId =
    Number(req.query.ulbId) ||
    Number(req.user?.orgId) ||      
    Number(req.user?.ulbId) ||
    Number(req.user?.ULBID) ||
    null;

  if (!ulbId) {
    throw new AppError("ULB ID is required", 400);
  }

  console.log("Interest List ulbId =", ulbId);
  console.log("req.user =", req.user);

  const data = await service.getInterestListService({ ulbId });
  return ok(res, data, "Interest list fetched successfully");
});

// ============================================
// GET INTEREST BY ID
// ============================================

exports.getInterestById = asyncHandler(async (req, res) => {
  const { interestId } = req.body;
  if (!interestId) throw new AppError("interestId is required", 400);

  const ulbId = Number(req.body.ulbId) || Number(req.user?.orgId);
  if (!ulbId) throw new AppError("ULB ID is required", 400);

  const data = await service.getInterestByIdService({ interestId, ulbId });
  return ok(res, data, "Interest fetched successfully");
});

// ============================================
// SAVE INTEREST
// ============================================

exports.saveInterest = asyncHandler(async (req, res) => {
  const interestData = req.body;

  interestData.ulbId =
    Number(interestData.ulbId) || Number(req.user?.orgId);
  interestData.userId =
    req.user?.sub || req.user?.userId || interestData.userId;

  if (!interestData.ulbId) throw new AppError("ULB ID is required", 400);
  if (!interestData.userId) throw new AppError("User ID is required", 400);

  const data = await service.saveInterestService(interestData);
  return ok(res, data, data.message);
});