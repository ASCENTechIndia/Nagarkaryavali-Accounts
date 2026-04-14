const { executeQuery } = require("../../../db/queryExecutor");

async function getBudgetHeadConfig({ headId }) {
  console.log("📤 Repo: Fetch Budget Head Config", { headId });

  const sql = `
    SELECT headid,
           headname,
           parentid,
           parent,
           headlevel,
           insby,
           insdate,
           parentsubheadid,
           parentheadid
    FROM view_budgetconfig_det
    WHERE headid = :headId
  `;

  const result = await executeQuery(sql, { headId });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function SubHead() {
  console.log("📤 Repo: Fetch Budget Level 2");

  const sql = `
    SELECT var_budgetconfig_budgetname AS budgetname,
           num_budgetconfig_headid AS headid
    FROM aoac_budgetconfig_det
    WHERE num_budgetconfig_parentid = 1
      AND num_budgetconfig_level = 2
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }
  return result.rows;
}

async function getGroup({ parentId }) {
  console.log("📤 Repo: Fetch Group", { parentId });

  const sql = `
    SELECT var_budgetconfig_budgetname AS budgetname,
           num_budgetconfig_headid AS headid,
           num_budgetconfig_parentid AS parentid
    FROM aoac_budgetconfig_det
    WHERE num_budgetconfig_parentid = :parentId
      AND num_budgetconfig_level = 3
  `;

  const result = await executeQuery(sql, { parentId });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getHead() {
  console.log("📤 Repo: Fetch Head (Level 1)");

  const sql = `
    SELECT var_budgetconfig_budgetname AS budgetname,
           num_budgetconfig_headid AS headid
    FROM aoac_budgetconfig_det
    WHERE num_budgetconfig_level = 1
    ORDER BY num_budgetconfig_headid
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getBudgetByLevel({ parentId, level }) {
  console.log("📤 Repo: Fetch Budget By Level", { parentId, level });

  let sql = `
    SELECT headid,
           headname,
           parentid,
           parent,
           headlevel,
           insby,
           insdate
    FROM view_budgetconfig_det
    WHERE parentid = :parentId
  `;

  const binds = { parentId };

  // ✅ FIX: use different bind name (NOT 'level')
  if (level !== undefined && level !== null) {
    sql += ` AND headlevel = :lvl`;
    binds.lvl = level;
  }

  console.log("SQL:", sql);
  console.log("BINDS:", binds);

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");

async function saveBudgetHeadRepo(payload) {
  console.log("📤 Repo: Execute Budget Head Procedure", payload);

  const sql = `
    BEGIN
      aoac_budgethead_config_ins(
        :In_UserId,
        :In_BudgetId,
        :In_Mode,
        :In_HeadId,
        :In_SubHeadId,
        :In_GroupId,
        :In_Name,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    In_UserId: payload.userId,
    In_BudgetId: payload.budgetId,
    In_Mode: payload.mode,
    In_HeadId: payload.headId,
    In_SubHeadId: payload.subHeadId,
    In_GroupId: payload.groupId,
    In_Name: payload.name,

    out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 500 },
  };

  const result = await executeProcedure({ sql, binds });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}



module.exports = {
  getBudgetHeadConfig,
  SubHead, 
  getGroup,
  getHead,
  getBudgetByLevel,
  saveBudgetHeadRepo
};