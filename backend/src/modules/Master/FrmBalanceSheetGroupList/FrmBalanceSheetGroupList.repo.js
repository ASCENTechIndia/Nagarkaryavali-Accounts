const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// 1. List
async function getBalGroupList() {
  const sql = `
    SELECT 
      num_balgrpmst_balgrpid AS Balgrpid,
      var_balgrpmst_balgrpname AS Balgrpname
    FROM AOAC_BALGRPMST_DEF
    ORDER BY var_balgrpmst_balgrpname
  `;

  const result = await executeQuery(sql);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 2. By ID
async function getBalGroupById(balgrpId) {
  const sql = `
    SELECT 
      num_balgrpmst_balgrpid AS Balgrpid,
      var_balgrpmst_balgrpname AS Balgrpname
    FROM AOAC_BALGRPMST_DEF
    WHERE num_balgrpmst_balgrpid = :balgrpId
  `;

  const result = await executeQuery(sql, { balgrpId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 3. Procedure
async function balGroupProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_balgrpmst_ins(
            :in_BalGrpId,
            :in_BalGrpName,
            :in_UserId,
            :in_Mode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_BalGrpId: data.balgrpId || null,
          in_BalGrpName: data.balgrpName,
          in_UserId: data.userId,
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
  getBalGroupList,
  getBalGroupById,
  balGroupProc,
};