
const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");
const { executeQuery } = require("../../../db/queryExecutor");

async function glMasterOperation(payload) {
  console.log("📤 Repo → Procedure Payload:", payload);

  const sql = `BEGIN
      aoac_glmaster_ins(
        :in_glcodeid,
        :in_glname,
        :in_glnameeng,
        :in_glsubtype,
        :in_UserId,
        :in_Mode,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;`;

  const binds = {
    ...payload,
    out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
  };

  const result = await executeProcedure({ sql, binds });

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    errorCode: result.outBinds.out_ErrorCode,
    errorMsg: result.outBinds.out_ErrorMsg,
  };
}

async function getGLMasterList() {
  const sql = `
    SELECT 
      LPAD(num_glmaster_glcode,3,'0') AS glcode,
      var_glmaster_glname AS glname
    FROM aoac_glmaster_def
    ORDER BY num_glmaster_glcode
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getGLMasterById(glcodeid) {
  console.log("📤 Repo: Fetch GL by ID:", glcodeid);

  const sql = `
    SELECT 
      LPAD(num_glmaster_glcode,3,'0') AS glcode,
      gl.var_glmaster_glname AS GLMarathi,
      gl.var_glmaster_glnameeng AS GLEnglish
    FROM aoac_glmaster_def gl
    WHERE num_glmaster_glcode = :glcodeid
  `;

  const result = await executeQuery(sql, { glcodeid });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


module.exports = {
  glMasterOperation,
  getGLMasterList,
  getGLMasterById
};