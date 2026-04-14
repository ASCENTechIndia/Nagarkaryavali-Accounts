const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");

async function getDepositTypeRepo({ ulbId }) {
  console.log("📤 Repo: Fetch Deposit Types", { ulbId });

  const sql = `
    SELECT 
      NUM_DEPOSITMST_DEPOSITTYPEID AS depid, 
      VAR_DEPOSITMST_DEPOSITTYPE AS depname,
      num_depositmst_ulbid
    FROM AOAC_DEPOSITTYPEMST_DEF 
    WHERE num_depositmst_ulbid = :ulbId
    ORDER BY NUM_DEPOSITMST_DEPOSITTYPEID
  `;

  const binds = { ulbId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getDepositTypeByIdRepo({ depId }) {
  console.log("📤 Repo: Fetch Deposit Type By ID", { depId });

  const sql = `
    SELECT 
      num_depositmst_deposittypeid AS depid,
      var_depositmst_deposittype AS depname,
      num_depositmst_ulbid
    FROM aoac_deposittypemst_def
    WHERE num_depositmst_deposittypeid = :depId
  `;

  const binds = { depId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function saveDepositTypeRepo(payload) {
  console.log("📤 Repo: Execute Deposit Procedure", payload);

  const sql = `
    BEGIN
      aoac_deposit_ins(
        :in_depositid,
        :in_depositname,
        :in_UserId,
        :in_Mode,
        :in_UlbID,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_depositid: payload.depId,
    in_depositname: payload.depName,
    in_UserId: payload.userId,
    in_Mode: payload.mode,
    in_UlbID: payload.ulbId,

    out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 500 },
  };

  const result = await executeProcedure({ sql, binds });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}

module.exports = {
  getDepositTypeRepo,
  getDepositTypeByIdRepo,
  saveDepositTypeRepo, 
};
