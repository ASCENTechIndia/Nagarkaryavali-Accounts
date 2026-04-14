const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");
async function getBankListRepo() {
  console.log("📤 Repo: Fetch Bank List");

  const sql = `
    SELECT 
      num_bankmst_bankid AS bankid,
      var_bankmst_bankname AS bankname
    FROM aoac_bankmst_def
    ORDER BY num_bankmst_bankid
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getBankByIdRepo({ bankId }) {
  console.log("📤 Repo: Fetch Bank By ID", { bankId });

  const sql = `
    SELECT 
      num_bankmst_bankid AS bankid,
      var_bankmst_bankname AS bankname
    FROM aoac_bankmst_def
    WHERE num_bankmst_bankid = :bankId
  `;

  const binds = { bankId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function saveBankRepo(payload) {
  console.log("📤 Repo: Execute Bank Procedure", payload);

  const sql = `
    BEGIN
      aoac_bank_ins(
        :in_BankId,
        :in_BankName,
        :in_UserId,
        :in_Mode,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_BankId: payload.bankId,
    in_BankName: payload.bankName,
    in_UserId: payload.userId,
    in_Mode: payload.mode,

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
  getBankListRepo,
  getBankByIdRepo,
  saveBankRepo
};
