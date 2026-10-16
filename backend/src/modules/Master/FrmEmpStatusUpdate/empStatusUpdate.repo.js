
const { executeQuery } = require("../../../db/queryExecutor");
const { executeProcedure } = require("../../../db/procedureExecutor");
const oracledb = require("oracledb");

/**
 * Execute AOAC_EMPSTATUSUPD_INS to insert, update, or delete employee status.
 */
async function saveEmpStatusUpdateRepo({
  userId,
  id,
  ulbId,
  empId,
  status,
  statusDate,
  reason,
  mode,
}) {
  console.log("📤 Repo: Execute AOAC_EMPSTATUSUPD_INS:", {
    userId,
    id,
    ulbId,
    empId,
    status,
    statusDate,
    reason: reason ? "[provided]" : null,
    mode,
  });

  const sql = `
    BEGIN
      AOAC_EMPSTATUSUPD_INS(
        :in_UserId,
        :in_Id,
        :in_UlbId,
        :in_EmpId,
        :in_Status,
        :in_StatusDt,
        :in_Reason,
        :in_Mode,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const parsedDate = statusDate ? new Date(statusDate) : null;

  const binds = {
    in_UserId: {
      val: String(userId),
      dir: oracledb.BIND_IN,
      type: oracledb.STRING,
    },
    in_Id: {
      val: id ?? null,
      dir: oracledb.BIND_IN,
      type: oracledb.NUMBER,
    },
    in_UlbId: {
      val: ulbId ?? null,
      dir: oracledb.BIND_IN,
      type: oracledb.NUMBER,
    },
    in_EmpId: {
      val: empId ?? null,
      dir: oracledb.BIND_IN,
      type: oracledb.NUMBER,
    },
    in_Status: {
      val: status ?? null,
      dir: oracledb.BIND_IN,
      type: oracledb.STRING,
    },
    in_StatusDt: {
      val: parsedDate,
      dir: oracledb.BIND_IN,
      type: oracledb.DATE,
    },
    in_Reason: {
      val: reason ?? null,
      dir: oracledb.BIND_IN,
      type: oracledb.STRING,
    },
    in_Mode: {
      val: Number(mode),
      dir: oracledb.BIND_IN,
      type: oracledb.NUMBER,
    },
    out_ErrorCode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    out_ErrorMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({ sql, binds });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}

module.exports = {
  saveEmpStatusUpdateRepo,
};
