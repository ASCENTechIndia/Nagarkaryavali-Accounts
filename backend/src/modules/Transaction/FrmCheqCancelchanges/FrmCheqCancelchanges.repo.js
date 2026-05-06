const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");


async function getChequeCancelDetails(params) {
  const query = `
    SELECT CHEQNO, CHEQDATE, VCHNO, VCHODATE, SYSTEMBILLDATE, CHEQAMT, REMARK, 
           ULBID, BANKNAME, BANKAC, TRANSNO, BANKGL, BANKACNO
    FROM VW_CheqCancelDetails
    WHERE TRUNC(vchodate) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') AND TO_DATE(:toDate, 'DD-MON-YYYY')
      AND ULBID = :ulbId
      AND (:transactionNo IS NULL OR TRANSNO = :transactionNo)
      AND (:chequeNo IS NULL OR CHEQNO = :chequeNo)
      AND (:amount IS NULL OR CHEQAMT = :amount)
      AND (:bankGl IS NULL OR BANKGL = :bankGl)
      AND (:bankAccNo IS NULL OR BANKACNO = :bankAccNo)
    GROUP BY CHEQNO, CHEQDATE, VCHNO, VCHODATE, SYSTEMBILLDATE, CHEQAMT, REMARK, 
             ULBID, BANKNAME, BANKAC, TRANSNO, BANKGL, BANKACNO
    ORDER BY VCHODATE
  `;

  return await executeQuery(query, params);
}

async function getChequeCancelDetailsAuto(params) {
  const query = `
    SELECT CHEQNO, CHEQDATE, VCHNO, VCHODATE, SYSTEMBILLNO, SYSTEMBILLDATE, 
           GROSSAMT, CHEQAMT, REMARK, ULBID, BANKNAME, BANKAC, TRANSNO, 
           BANKGL, BANKACNO, CHQBOOK, zoneename, nidhi, ZONEID
    FROM VW_CheqCancelDetails
    WHERE TRANSNO = :transNo
      AND ULBID = :ulbId
      AND CHEQNO = :chequeNo
  `;

  return await executeQuery(query, params);
}

async function insertCheqCancelRepo(payload) {
  console.log("📤 Repo: Execute Cheque Cancel Procedure", payload);

  const sql = `
    BEGIN
      aoac_CheqCancel_ins(
        :in_UserId, :in_Ulbid, :in_chequeno, :in_Cheqbookno, 
        :in_cheqdate, :in_Transno, :in_Remark, :in_glcode, 
        :in_accno, :in_Ward, :IN_vchno, :IN_vchDate, 
        :IN_Nidhiid, :in_vchremark, :in_oldchequeno, 
        :in_oldcheqdate, :in_oldCheqbookno, 
        :out_ErrorCode, :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_UserId: payload.userId,
    in_Ulbid: Number(payload.ulbId),
    in_chequeno: Number(payload.chequeNo),
    in_Cheqbookno: Number(payload.cheqBookNo), 
    in_cheqdate: payload.cheqDate ? new Date(payload.cheqDate) : null,
    in_Transno: Number(payload.transNo),
    in_Remark: payload.remark,
    in_glcode: Number(payload.glCode), 
    in_accno: Number(payload.accNo),   
    in_Ward: Number(payload.ward),     
    IN_vchno: payload.vchNo,
    IN_vchDate: payload.vchDate ? new Date(payload.vchDate) : null,
    IN_Nidhiid: Number(payload.nidhiId), 
    in_vchremark: payload.vchRemark,
    in_oldchequeno: payload.oldChequeNo ? Number(payload.oldChequeNo) : null,
    in_oldcheqdate: payload.oldCheqDate ? new Date(payload.oldCheqDate) : null,
    in_oldCheqbookno: payload.oldCheqBookNo ? Number(payload.oldCheqBookNo) : null,
    out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 1000 },
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

module.exports = {
  getChequeCancelDetails, getChequeCancelDetailsAuto, insertCheqCancelRepo
};
