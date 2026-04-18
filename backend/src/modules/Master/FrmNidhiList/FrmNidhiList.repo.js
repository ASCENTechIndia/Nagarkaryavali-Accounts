const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

async function getNidhiList() {
  const sql = `
    SELECT 
      num_nidhi_id, 
      var_budgetconfig_budgetname, 
      var_nidhi_nidhiname, 
      CASE var_nidhi_flag 
        WHEN 'Y' THEN 'Active' 
        WHEN 'N' THEN 'Inactive' 
      END AS status 
    FROM aoac_nidhi_master 
    INNER JOIN aoac_budgetconfig_det 
      ON num_nidhi_budgetid = num_budgetconfig_headid 
    ORDER BY num_nidhi_id
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getNidhiById(nidhiId) {
  const sql = `
    SELECT 
      var_budgetconfig_budgetname, 
      num_budgetconfig_headid, 
      var_nidhi_nidhiname, 
      var_nidhi_flag 
    FROM aoac_nidhi_master 
    INNER JOIN aoac_budgetconfig_det 
      ON num_nidhi_budgetid = num_budgetconfig_headid 
    WHERE num_nidhi_id = :nidhiId
  `;

  const result = await executeQuery(sql, { nidhiId });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function nidhiMasterProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_nidhi_ins(
            :in_UserId,
            :in_nidhiid,
            :in_nidhiname,
            :in_budgetid,
            :in_activeflag,
            :in_Mode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_UserId: data.userId,
          in_nidhiid: data.nidhiId || null,
          in_nidhiname: data.nidhiName,
          in_budgetid: data.budgetId,
          in_activeflag: data.activeFlag,
          in_Mode: data.mode,

          out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },
          out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 2000,
          },
        }
      );

      return res.outBinds;
    });

    console.log("Result: ", result);

    return {
      success: true,
      errorCode: result.out_ErrorCode,
      errorMsg: result.out_ErrorMsg,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  getNidhiList,
  getNidhiById,
  nidhiMasterProc,
};