const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./glmaster.service");

exports.glMaster = asyncHandler(async (req, res) => {
  const payload = {
    in_glcodeid: req.body.glcodeid || null,
    in_glname: req.body.glname,
    in_glnameeng: req.body.glnameeng,
    in_glsubtype: req.body.glsubtype,
    in_UserId: req.body.userId,
    in_Mode: Number(req.body.mode),
  };

  const data = await service.glMasterService(payload);

  return ok(res, data, data.message);
});

exports.getGLMasterList = asyncHandler(async (req, res) => {
  const data = await service.getGLMasterListService();

  return ok(res, data, "GL Master list fetched");
});

exports.getGLMasterById = asyncHandler(async (req, res) => {
  const glcodeid = req.params.id;

  const data = await service.getGLMasterByIdService(glcodeid);

  return ok(res, data, "GL record fetched");
});