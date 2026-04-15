const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");


async function getBalGroupList() {
  const sql = `
    SELECT 
      num_balgrpmst_balgrpid AS value, 
      var_balgrpmst_balgrpname AS label
    FROM AOAC_BALGRPMST_DEF
    ORDER BY var_balgrpmst_balgrpname
  `;

  const result = await executeQuery(sql);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}
async function getBalSubGroupList(groupId) {
  const sql = `
    SELECT 
      s.num_balgrpmst_balgrpid,
      s.num_balsubgrpmst_balsubgrpid,
      s.var_balsubgrpmst_balsubgrpname,
      g.var_balgrpmst_balgrpname,
      s.var_balsubgrpmst_insby,
      s.var_balsubgrpmst_updby,
      s.var_balsubgrpmst_upddate
    FROM aoac_balsubgrpmst_def s
    JOIN AOAC_BALGRPMST_DEF g 
      ON s.num_balgrpmst_balgrpid = g.num_balgrpmst_balgrpid
    WHERE g.num_balgrpmst_balgrpid = :groupId
    ORDER BY UPPER(s.var_balsubgrpmst_balsubgrpname)
  `;

  const result = await executeQuery(sql, { groupId });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}
async function balSubGroupProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_balsubgrpmst_ins(
            :in_BalGrpId,
            :in_BalSubGrpId,
            :in_BalSubGrpName,
            :in_UserId,
            :in_Mode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_BalGrpId: data.groupId,
          in_BalSubGrpId: data.subGroupId || null,
          in_BalSubGrpName: data.subGroupName,
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
async function getBalSubGroupById(subGroupId) {
  const sql = `
    SELECT 
      num_balgrpmst_balgrpid AS Balancegrpid,
      num_balsubgrpmst_balsubgrpid AS BalanceSubgrpId,
      var_balsubgrpmst_balsubgrpname AS BalanceSubgrpname
    FROM aoac_balsubgrpmst_def
    WHERE num_balsubgrpmst_balsubgrpid = :subGroupId
  `;

  const result = await executeQuery(sql, { subGroupId });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}
module.exports = {
  getBalGroupList,
  getBalSubGroupList,
  balSubGroupProc,
  getBalSubGroupById,
};