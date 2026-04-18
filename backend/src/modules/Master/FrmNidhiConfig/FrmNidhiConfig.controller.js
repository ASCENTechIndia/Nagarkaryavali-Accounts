const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmNidhiConfig.service");


// ✅ List (POST)
exports.getNidhiListConfig = asyncHandler(async (req, res) => {
  const data = await service.getNidhiListConfigService(req.body);
  return ok(res, data, "Nidhi config list fetched");
});

// ✅ Master (POST)
exports.getNidhiMstConfig = asyncHandler(async (req, res) => {
  const data = await service.getNidhiMstConfigService(req.body);
  return ok(res, data, "Nidhi master fetched");
});

// ✅ Insert
exports.insertNidhiConfig = asyncHandler(async (req, res) => {
  const data = await service.insertNidhiConfigService(req.body);
  return ok(res, data, data.errorMsg);
});