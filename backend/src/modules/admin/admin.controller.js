const asyncHandler = require("../../libs/asyncHandler");
const { ok } = require("../../libs/response");
const service = require("./admin.service");

/**
 * POST /api/admin/query
 * body:
 * {
 *   "sql": "SELECT * FROM users WHERE id = $1",
 *   "params": [1]
 * }
 */
exports.runQuery = asyncHandler(async (req, res) => {
  const { sql, params, allowWrite } = req.body;

  const result = await service.runDynamicQuery({
    sql,
    params,
    allowWrite: Boolean(allowWrite),
  });

  return ok(res, result, "Query executed");
});

exports.executeProcedure = asyncHandler(async (req, res) => {
  const { name, params, isFunction } = req.body;

  const result = await service.runStoredProcedure({
    name,
    params,
    isFunction,
  });

  return ok(res, result, "Procedure executed");
});
