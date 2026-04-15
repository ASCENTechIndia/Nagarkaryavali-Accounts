const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// 1. District List by State
async function getDistrictListByState(stateId) {
  const sql = `
    SELECT 
      d.num_districtmst_districtid,
      d.var_districtmst_districtname,
      d.num_districtmst_stateid,
      s.var_statemst_statename,
      d.var_districtmst_insby, 
      d.date_districtmst_insdate, 
      d.var_districtmst_updby, 
      d.var_districtmst_upddate
    FROM aoac_districtmst_def d
    JOIN aoac_statemst_def s  
      ON d.num_districtmst_stateid = s.num_statemst_stateid 
    WHERE d.num_districtmst_stateid = :stateId
    ORDER BY UPPER(d.var_districtmst_districtname)
  `;

  const result = await executeQuery(sql, { stateId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 2. District By ID
async function getDistrictById(districtId) {
  const sql = `
    SELECT 
      num_districtmst_stateid AS Stateid,
      num_districtmst_districtid AS Districtid,
      var_districtmst_districtname AS Districtname
    FROM aoac_districtmst_def
    WHERE num_districtmst_districtid = :districtId
  `;

  const result = await executeQuery(sql, { districtId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 3. Procedure
async function districtProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_district_ins(
            :in_stateid,
            :in_districtid,
            :in_districtname,
            :in_UserId,
            :in_Mode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_stateid: data.stateId,
          in_districtid: data.districtId || null,
          in_districtname: data.districtName,
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
async function getStateById(stateId) {
  const sql = `
    SELECT 
      num_statemst_stateid AS Stateid,
      var_statemst_statename AS Statename
    FROM aoac_statemst_def
    WHERE num_statemst_stateid = :stateId
  `;

  const result = await executeQuery(sql, { stateId });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}


async function stateProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_state_ins(
            :in_stateid,
            :in_statename,
            :in_UserId,
            :in_Mode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_stateid: data.stateId || null,
          in_statename: data.stateName,
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
  getDistrictListByState,
  getDistrictById,
  districtProc,
  getStateById,
  stateProc,

};