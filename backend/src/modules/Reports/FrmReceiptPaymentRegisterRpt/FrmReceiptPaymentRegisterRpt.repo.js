const { executeQuery } = require("../../../db/queryExecutor");

async function getReceiptPaymentRegisterRepo(payload) {
  const { fromDate, toDate, ulbId } = payload;

  let sql = `
    SELECT
        TRNSDATE,
        DOCNO,
        ACCNAME,
        RECEIPTAMT,
        PAYMENTAMT,
        NARRATION,
        ADATA_ACCNAME,
        FLAG,
        TRANSNO
    FROM Vw_GeneralCashierscashbook
    WHERE TRUNC(TRNSDATE)
    BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
    AND TO_DATE(:toDate,'DD-MM-YYYY')
    ORDER BY
    TRNSDATE,
    CASE
        WHEN REGEXP_LIKE(docno, '^\\d+$')
        THEN TO_NUMBER(docno)
        ELSE NULL
    END
  `;

  const result = await executeQuery(sql, {
    fromDate,
    toDate,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getOpeningClosingRepo(payload) {
  const { fromDate, ulbId } = payload;

  let sql = `
    SELECT balance FROM (
        SELECT NVL(SUM(openingbal) * -1, 0) AS balance
        FROM accountview_web c
        WHERE c.accsubtypeid IN (4810,4811,4812,4813,4814,4815)
        AND c.ulbid = :ulbId
    ) balance
  `;

  const result = await executeQuery(sql, {
    ulbId,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getPreviousSummaryRepo(payload) {
  const { fromDate } = payload;

  let sql = `
    SELECT
      SUM(RECEIPTAMT) RECEIPTAMT,
      SUM(PAYMENTAMT) PAYMENTAMT
    FROM Vw_GeneralCashierscashbook
    WHERE TRUNC(TRNSDATE) < TO_DATE(:fromDate,'DD-MM-YYYY')
  `;

  const result = await executeQuery(sql, {
    fromDate,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

module.exports = {
  getReceiptPaymentRegisterRepo,
  getOpeningClosingRepo,
  getPreviousSummaryRepo,
};
