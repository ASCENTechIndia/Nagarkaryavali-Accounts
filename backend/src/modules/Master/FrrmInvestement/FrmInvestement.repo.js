const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// 1. Get Investment List
async function getInvestmentList() {
  const sql = `
    SELECT 
      num_invsttype_invsttypeid AS Investid,
      var_invsttype_invsttypename AS Investname
    FROM AOAC_INVSTTYPEMST_DEF
    ORDER BY var_invsttype_invsttypename
  `;

  const result = await executeQuery(sql);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 2. Get Investment By ID
async function getInvestmentById(investId) {
  const sql = `
    SELECT 
      num_invsttype_invsttypeid AS Investid,
      var_invsttype_invsttypename AS Investname
    FROM AOAC_INVSTTYPEMST_DEF
    WHERE num_invsttype_invsttypeid = :investId
  `;

  const result = await executeQuery(sql, { investId });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 3. Procedure
async function investmentProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_investmentmst_ins(
            :in_invid,
            :in_invname,
            :in_UserId,
            :in_Mode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_invid: data.investId || null,
          in_invname: data.investName,
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
  getInvestmentList,
  getInvestmentById,
  investmentProc,
};