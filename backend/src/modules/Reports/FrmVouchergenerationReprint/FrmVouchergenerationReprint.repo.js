const { executeQuery } = require("../../../db/queryExecutor");

async function getVoucherGenerationReprintRepo(payload) {
  console.log("📤 Repo: Fetch Voucher Generation Reprint", payload);

  const { fromDate, toDate, ulbId } = payload;

  const sql = `
    SELECT
      prevchno,
      TRUNC(transdate) AS transdate,
      SUM(cramt) AS cramt,
      refno,
      partyname,
      zoneename
    FROM vw_vchgendtlsrpt
    WHERE TRUNC(transdate)
      BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
      AND TO_DATE(:toDate,'DD-MM-YYYY')
      AND ulbid = :ulbId
    GROUP BY
      prevchno,
      TRUNC(transdate),
      refno,
      partyname,
      zoneename
    ORDER BY
      prevchno,
      TRUNC(transdate)
  `;

  const binds = {
    fromDate,
    toDate,
    ulbId,
  };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

// PRINT PDF API
async function getVoucherGenerationPrintRepo(payload) {
  console.log("📤 Repo: Fetch Voucher Generation Print", payload);

  const { refNo, ulbId } = payload;

  const sql = `
    SELECT
      REFNO,
      PARTYID,
      PARTYNAME,
      ZONEENAME,
      ZONEID,
      DRGLCODE,
      DRACCNO,
      AMT,
      USERNAME,
      CRACNAME,
      CRAMT,
      NARRATION,
      ULBID,
      PREVCHNO,
      DEPTNAME,
      MANUALNO,
      SYSTEMBILLNO,
      TRANSNO,
      BALAMT,
      CHQNO,
      CHQDATE,
      CHQBOOKNO,
      BANKNAME,
      PAYMODE,
      TRANSDATE,
      GROSSAMOUNT,
      VOUCHERDATE
    FROM vw_vchgendtlsrpt
    WHERE REFNO = :refNo
      AND ULBID = :ulbId
  `;

  const sql2 = `
    SELECT
      glcode,
      accno,
      amount,
      accname,
      ulbid,
      transno,
      payamt
    FROM vw_vchgendtlsrpt_details
    WHERE transno = :refNo
      AND ulbid = :ulbId
  `;

  const binds = {
    refNo,
    ulbId,
  };

  const result1 = await executeQuery(sql, binds);

  if (!result1.success) {
    throw new Error(result1.error);
  }

  const result2 = await executeQuery(sql2, binds);

  if (!result2.success) {
    throw new Error(result2.error);
  }

  return {
    mainData: result1.rows,

    taxDetails: result2.rows,
  };
}

module.exports = {
  getVoucherGenerationReprintRepo,

  getVoucherGenerationPrintRepo,
};
