const { executeQuery } = require("../../db/queryExecutor");
const { executeProcedure } = require("../../db/procedureExecutor");
const { AppError } = require("../../libs/errors");
/**
 * Executes dynamic query
 * - READ-ONLY by default
 * - Optional write allowed for ADMIN
 */
async function runDynamicQuery({ sql, params = [], allowWrite = false }) {
  if (!sql) throw new AppError("SQL is required", 422);

  const upperSql = sql.trim().toUpperCase();

  // 🚫 Block dangerous commands
  const blocked = ["DROP ", "TRUNCATE ", "ALTER ", "DELETE FROM"];
  if (!allowWrite && blocked.some((k) => upperSql.includes(k))) {
    throw new AppError("Write operations are not allowed", 403);
  }

  return executeQuery(sql, params);
}

async function runStoredProcedure({
  name,
  params,
  isFunction,
}) {
  if (!name) throw new AppError("Procedure name is required", 422);

  // 🔒 Hard security rules
  if (name.includes(";") || name.includes("--")) {
    throw new AppError("Invalid procedure name", 400);
  }

  return executeProcedure({
    name,
    params,
    isFunction: Boolean(isFunction),
    useTx: true,
  });
}

module.exports = { runDynamicQuery, runStoredProcedure };