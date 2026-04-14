const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./frmzoneList.service");

exports.getCorporation = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { corpId } = req.body;

  if (!corpId) {
    throw new AppError("corpId is required", 400);
  }

  const payload = { corpId };

  const data = await service.getCorporationService(payload);

  return ok(res, data, "Corporation fetched successfully");
});

exports.saveZone = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { zoneId, zoneName, userId, mode, ulbId } = req.body;

  // 🔥 Validations
  if (!mode) {
    throw new AppError("mode is required (1=insert,2=update,3=delete)", 400);
  }

  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  if (!zoneName && mode !== 3) {
    throw new AppError("zoneName is required", 400);
  }

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  if (mode !== 1 && !zoneId) {
    throw new AppError("zoneId is required for update/delete", 400);
  }

  const payload = {
    zoneId,
    zoneName,
    userId,
    mode,
    ulbId,
  };

  const data = await service.saveZoneService(payload);

  return ok(res, data, "Zone operation executed successfully");
});