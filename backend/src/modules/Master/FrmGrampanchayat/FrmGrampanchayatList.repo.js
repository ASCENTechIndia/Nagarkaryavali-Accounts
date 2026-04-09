const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// 1. Department List
async function getDeptList() {
  const sql = `
    SELECT 
      num_deptmst_deptid AS value,
      var_deptmst_deptname AS label
    FROM aoac_deptmst_def
    ORDER BY var_deptmst_deptname
  `;

  const result = await executeQuery(sql);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 2. Grampanch List by Dept
async function getGrampanchList(deptId) {
  const sql = `
    SELECT 
      d.num_deptmst_deptid,
      d.var_deptmst_deptname,
      g.num_grampanch_grampanchid,
      g.var_grampanch_grampanch,
      g.num_grampanch_deptid,
      g.var_grampanch_marathiname,
      g.var_grampanch_insby,
      g.var_grampanch_updby
    FROM aoac_grampanch_def g
    JOIN aoac_deptmst_def d 
      ON g.num_grampanch_deptid = d.num_deptmst_deptid
    WHERE g.num_grampanch_deptid = :deptId
    ORDER BY UPPER(g.var_grampanch_grampanch)
  `;

  const result = await executeQuery(sql, { deptId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 3. Grampanch By ID
async function getGrampanchById(grampanchId) {
  const sql = `
    SELECT 
      num_grampanch_grampanchid,
      num_grampanch_deptid,
      var_grampanch_grampanch,
      var_grampanch_marathiname
    FROM aoac_grampanch_def
    WHERE num_grampanch_grampanchid = :grampanchId
  `;

  const result = await executeQuery(sql, { grampanchId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 4. Procedure
async function grampanchProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_grampanch_ins(
            :in_grampanchid,
            :in_deptid,
            :in_grampanch,
            :in_marathiname,
            :in_UserId,
            :in_Mode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_grampanchid: data.grampanchId || null,
          in_deptid: data.deptId,
          in_grampanch: data.grampanchName,
          in_marathiname: data.marathiName || null,
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
    return { success: false, error: err.message };
  }
}

module.exports = {
  getDeptList,
  getGrampanchList,
  getGrampanchById,
  grampanchProc,
};