// const asyncHandler = require("../../libs/asyncHandler");
// const { ok } = require("../../libs/response");
// const service = require("./MenuAccess.service");
// const { ipToNumber } = require("../../libs/ipToNumber");



// exports.getMenuAccess = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const data = await service.getMenuAccess(id);
//   return ok(res, data);
// });

const asyncHandler = require("../../libs/asyncHandler");
const { ok } = require("../../libs/response");
const service = require("./MenuAccess.service");

exports.getMenus = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const payload = {
    userId: req.body.userId,
    ulbId: req.body.ulbId,
    deptId: req.body.deptId,
  };

  const data = await service.getMenusService(payload);

  return ok(res, data, "Menus fetched successfully");
});

exports.getCorporation = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const payload = {
    ulbId: req.body.ulbId,
  };

  const data = await service.getCorporationService(payload);

  return ok(res, data, "Corporation fetched successfully");
});
