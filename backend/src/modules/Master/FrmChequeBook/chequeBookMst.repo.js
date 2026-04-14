const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");

async function getUserDetailsRepo({ ulbId, userId }) {
  console.log("📤 Repo: Fetch User Details", { ulbId, userId });

  const sql = `
    SELECT 
        var_user_username,
        num_user_userid 
    FROM admins.aoma_user_def
    WHERE num_user_ulbid = :ulbId
      AND num_user_userid = :userId
  `;

  const binds = { ulbId, userId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getNextChequeBookNoRepo({ glCode, accNo, ulbId }) {
  console.log("📤 Repo: Fetch Next Cheque Book Number", {
    glCode,
    accNo,
    ulbId,
  });

  const sql = `
    SELECT 
      NVL(MAX(num_chequebook_bookno) + 1, 1) AS cheqbookno
    FROM aoac_chequebook_def
    WHERE num_chequebook_bankglcode = :glCode
      AND num_chequebook_bankaccno = :accNo
      AND num_chequebook_ulbid = :ulbId
  `;

  const binds = { glCode, accNo, ulbId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function saveChequeBookRepo(payload) {
  console.log("📤 Repo: Execute Cheque Book Procedure", payload);

  const sql = `
    BEGIN
      aoac_chequebook_ins(
        :in_EmpName,
        :in_GLCode,
        :in_BankAcc,
        :in_chqnofrom,
        :in_chqnoto,
        :in_totalchq,
        :in_UserId,
        :in_chqbookno,
        :in_zoneid,
        :in_Empid,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_EmpName: payload.empName,
    in_GLCode: payload.glCode,
    in_BankAcc: payload.bankAcc,
    in_chqnofrom: payload.chqNoFrom,
    in_chqnoto: payload.chqNoTo,
    in_totalchq: payload.totalChq,
    in_UserId: payload.userId,
    in_chqbookno: payload.chqBookNo,
    in_zoneid: payload.zoneId,
    in_Empid: payload.empId,

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
  getUserDetailsRepo,
  getNextChequeBookNoRepo,
  saveChequeBookRepo
};
