const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./Frmauthorizationconfig.service");

// List
exports.getAuthorizationConfigList = asyncHandler(async (req, res) => {
  const data = await service.getAuthorizationConfigListService();
  return ok(res, data, "Authorization config list fetched");
});

// Update Details Controller
exports.getAuthorizationConfigDetails = asyncHandler(async (req, res) => {
  const data = await service.getAuthorizationConfigDetailsService();
  return ok(res, data, "Authorization config details fetched");
});

// 🔥 Procedure Controller
exports.authorizationConfigMaster = asyncHandler(async (req, res) => {
  const data = await service.authorizationConfigService(req.body);
  return ok(res, data, data.errorMsg);
});

