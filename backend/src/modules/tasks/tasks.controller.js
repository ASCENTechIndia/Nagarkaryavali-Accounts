const { ok } = require("../../libs/response");
const asyncHandler = require("../../libs/asyncHandler");
const service = require("./tasks.service");

exports.getAll = asyncHandler(async (req, res) => {
  const data = await service.getAll();
  return ok(res, data);
});

exports.create = asyncHandler(async (req, res) => {
  const data = await service.addTask(req.body.title);
  return ok(res, data, "created");
});

exports.toggle = asyncHandler(async (req, res) => {
  const data = await service.toggleTask(Number(req.params.id));
  return ok(res, data, "updated");
});

exports.remove = asyncHandler(async (req, res) => {
  await service.deleteTask(Number(req.params.id));
  return ok(res, null, "deleted");
});
