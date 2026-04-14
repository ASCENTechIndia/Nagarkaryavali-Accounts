const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// 1. Account List by SubType
async function getAccountBySubType(subTypeId) {
  const sql = `
    SELECT 
      glcode, 
      glname, 
      glnameeng,  
      accno, 
      accname, 
      accnameeng, 
      acctypeid, 
      acctype, 
      accsubtypeid, 
      accsubtype, 
      oldaccno, 
      openingbal, 
      flag, 
      accsearchname, 
      budgetamt, 
      revbudgetamt,
      functioncode,
      objectcode 
    FROM accountview_web 
    WHERE accsubtypeid = :subTypeId
    ORDER BY glcode, accno
  `;

  const result = await executeQuery(sql, { subTypeId });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 2. Procedure
async function budgetPreparationProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_budgetpreparation_ins(
            :in_UserId,
            :in_ULBId,
            :in_str,
            :Out_errorCode,
            :Out_ErrorMsg
          );
        END;`,
        {
          in_UserId: data.userId,
          in_ULBId: data.ulbId,
          in_str: data.paramStr,

          Out_errorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },
          Out_ErrorMsg: {
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
// 3. Account SubType List
async function getAccSubTypeList() {
  const sql = `
    SELECT 
      num_accsubtypemst_accsubtypeid || ' - ' || var_accsubtypemst_accsubtype AS accsubtype,
      num_accsubtypemst_accsubtypeid 
    FROM aoac_accsubtypemaster_def
    ORDER BY num_accsubtypemst_accsubtypeid
  `;

  const result = await executeQuery(sql);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}
module.exports = {
  getAccountBySubType,
  budgetPreparationProc,
  getAccSubTypeList,
};