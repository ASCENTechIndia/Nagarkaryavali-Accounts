const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// ✅ 1. Get Nidhi Config List
async function getNidhiListConfig({ ulbId, budgetId }) {
  const query = `
    SELECT 
      num_nidhiconfig_configid AS configid,
      num_nidhiconfig_nidhiid AS nidhiid,
      var_nidhi_nidhiname AS nidhiname,
      num_nidhiconfig_ulbid AS ulbid
    FROM aoac_nidhiconfig_config
    INNER JOIN aoac_nidhi_master 
      ON num_nidhi_id = num_nidhiconfig_nidhiid
    WHERE num_nidhiconfig_ulbid = :ulbId
      AND num_nidhiconfig_budgetid = :budgetId
    ORDER BY var_nidhiconfig_flag
  `;

  const result = await executeQuery(query, { ulbId, budgetId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// ✅ 2. Get Nidhi Master Config
async function getNidhiMstConfig({ ulbId, budgetId }) {
  const query = `
    SELECT 
      num_nidhi_id AS nidhiid,
      var_nidhi_nidhiname AS nidhiname,
      'N' AS previousstatus,
      'N' AS currentstatus,
      num_nidhiconfig_ulbid AS ulbid
    FROM aoac_nidhi_master
    LEFT JOIN aoac_nidhiconfig_config 
      ON num_nidhiconfig_nidhiid = num_nidhi_id
      AND num_nidhiconfig_ulbid = :ulbId
    WHERE var_nidhi_flag = 'Y'
      AND num_nidhi_budgetid = :budgetId
    ORDER BY num_nidhi_id
  `;

  const result = await executeQuery(query, { ulbId, budgetId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// ✅ 3. Insert / Update Nidhi Config (Procedure)
async function insertNidhiConfig(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN
          aoac_nidhiconfig_ins(
            :in_UserId,
            :in_UlbId,
            :in_NidhiCfgStr,
            :in_BudgetId,
            :in_Mode,
            :in_ipaddress,
            :in_source,
            :Out_errorCode,
            :Out_ErrorMsg
          );
        END;`,
        {
          in_UserId: data.userId || null,
          in_UlbId: Number(data.ulbId),
          in_NidhiCfgStr: data.nidhiCfgStr || null,
          in_BudgetId: Number(data.budgetId),
          in_Mode: data.mode,
          in_ipaddress: data.ipAddress || null,
          in_source: data.source || "WEB",

          Out_errorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },
          Out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 500,
          },
        }
      );

      return res.outBinds;
    });

    return {
      success: true,
      errorCode: result.OUT_ERRORCODE,
      errorMsg: result.OUT_ERRORMSG,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  getNidhiListConfig,
  getNidhiMstConfig,
  insertNidhiConfig,
};