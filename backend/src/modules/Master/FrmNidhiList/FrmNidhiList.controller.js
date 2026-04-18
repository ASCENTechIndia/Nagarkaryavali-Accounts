const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmNidhiList.service");

exports.getNidhiList = asyncHandler(async (req, res) => {
  const data = await service.getNidhiListService();
  return ok(res, data, "Nidhi list fetched");
});

exports.getNidhiById = asyncHandler(async (req, res) => {
  const nidhiId = req.params.id;

  const data = await service.getNidhiByIdService(nidhiId);
  return ok(res, data, "Nidhi details fetched");
});

exports.nidhiMaster = asyncHandler(async (req, res) => {
  const data = await service.nidhiMasterService(req.body);
  return ok(res, data, data.message);
});
