const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./BudgetHeadConfig.service");

exports.getBudgetHeadConfig = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { headId } = req.body;
  if (!headId) {
    throw new AppError("headId is required", 400);
  }
  const payload = { headId };
  const data = await service.getBudgetHeadConfigService(payload);
  return ok(res, data, "Budget Head Config fetched successfully");
});

exports.getSubHead = asyncHandler(async (req, res) => {
  console.log("📥 Request: Fetch Budget Level 2");
  const data = await service.getSubHead();
  return ok(res, data, "Budget Level 2 fetched successfully");
});

exports.getGroup = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);
  const { parentId } = req.body;

  if (!parentId) {
    throw new AppError("parentId is required", 400);
  }
  const payload = { parentId };
  const data = await service.getGroup(payload);
  return ok(res, data, "Group fetched successfully");
});

exports.getHead = asyncHandler(async (req, res) => {
  console.log("📥 Request: Fetch Head");
  const data = await service.getHead();
  return ok(res, data, "Head fetched successfully");
});

exports.getBudgetByLevel = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);
  const { parentId, level } = req.body;

  // if (!parentId) {
  //   throw new AppError("parentId is required", 400);
  // }
  if (level && ![1, 2, 3, 4].includes(level)) {
    throw new AppError("level must be between 1 and 4", 400);
  }

  const payload = { parentId, level };
  const data = await service.getBudgetByLevel(payload);
  return ok(res, data, "Budget data fetched successfully");
});

exports.saveBudgetHead = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const {
    userId,
    budgetId,
    mode,
    headId,
    subHeadId,
    groupId,
    name,
  } = req.body;

  if (!mode) {
    throw new AppError("mode is required (1=insert,2=update)", 400);
  }

  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  if (!name) {
    throw new AppError("name is required", 400);
  }

  const payload = {
    userId,
    budgetId,
    mode,
    headId,
    subHeadId,
    groupId,
    name,
  };

  const data = await service.saveBudgetHeadService(payload);

  return ok(res, data, "Budget head operation executed successfully");
});