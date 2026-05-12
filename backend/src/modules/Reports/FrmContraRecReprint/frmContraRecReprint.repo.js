const { executeQuery } = require("../../../db/queryExecutor");

async function getContraReceiptListRepo({ fromDate, toDate, ulbId }) {
  console.log("📤 Repo: Fetch Contra Receipt Reprint", {
    fromDate,
    toDate,
    ulbId,
  });

  const sql = `
    SELECT
      VOUCHERNO,
      VOUCHERDATE,
      CRAMOUNT,
      CRACCOUNTCODE,
      CRPARTICULARS,
      DRAMOUNT,
      DRACCOUNTCODE,
      DRPARTICULARS,
      REFNO,
      CHQNO
    FROM vw_contrarecreprint
    WHERE TRUNC(VOUCHERDATE)
          BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY')
              AND TO_DATE(:toDate, 'DD-MON-YYYY')
      AND ULBID = :ulbId
    ORDER BY VOUCHERNO, REFNO
  `;

  const result = await executeQuery(sql, {
    fromDate,
    toDate,
    ulbId,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

module.exports = {
  getContraReceiptListRepo,
};