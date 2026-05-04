const { executeQuery } = require("../../../db/queryExecutor");


// ================= DETAILS =================
async function getCashbookDetails(filters) {
  let params = {
    fromDate: filters.fromDate,
    toDate: filters.toDate
  };

  let sql = `
    SELECT TRNSDATE, DOCNO, ACCNAME, RECEIPTAMT, PAYMENTAMT, 
           NARRATION, ADATA_ACCNAME, FLAG, TRANSNO, CHQNO, 
           BANKNAME, ACCNOAC
    FROM Vw_GeneralCashierscashbook
    WHERE TRUNC(TRNSDATE) BETWEEN TO_DATE(:fromDate,'DD-MON-YYYY')
    AND TO_DATE(:toDate,'DD-MON-YYYY')
  `;

  // 🔹 GL Filter
  if (filters.glcode && filters.accno) {
    sql += " AND GLCODE = :glcode AND ACCNO = :accno ";
    params.glcode = filters.glcode;
    params.accno = filters.accno;
  }

  // 🔹 Party Filter
  if (filters.partycode) {
    sql += " AND PARTYCODE = :partycode ";
    params.partycode = filters.partycode;
  }

  sql += `
    ORDER BY TRNSDATE,
    CASE 
      WHEN REGEXP_LIKE(DOCNO, '^\\d+$') 
      THEN TO_NUMBER(DOCNO) 
      ELSE NULL 
    END
  `;

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}


// ================= SUMMARY =================
async function getCashbookSummary(filters) {
  let params = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    ulbId: filters.ulbId
  };

  let sql = `
  SELECT 
    SUM(NVL(opening_balance,0)) AS OPENING,
    SUM(NVL(receipt,0)) AS RECEIPT,
    SUM(NVL(payment,0)) AS PAYMENT,
    SUM(NVL(closing_balance,0)) AS CLOSING
  FROM(
    SELECT 
      NVL(o.opening_balance,0) opening_balance,
      NVL(r.receipt_amount,0) receipt,
      NVL(p.payment_amount,0) payment,
      NVL(o.opening_balance,0) + NVL(r.receipt_amount,0) - NVL(p.payment_amount,0) closing_balance
    FROM
    (
      SELECT a.glcode, a.accno,
      SUM(
        CASE 
          WHEN a.trnstypeid <> 4 AND a.sourceid <> 7 
          THEN a.amount 
          ELSE 0 
        END
      ) AS opening_balance
      FROM transview a
      WHERE a.ulbid = :ulbId
        AND a.amount > 0
        AND a.trnstypeid IN (3,4,5,8,9)
        AND a.sourceid <> 6
        AND TRUNC(a.trnsdate) < TO_DATE(:fromDate,'DD-MON-YYYY')
  `;

  // 🔹 Party filter (opening)
  if (filters.partycode) {
    sql += " AND a.partycode = :partycode ";
    params.partycode = filters.partycode;
  }

  sql += `
      GROUP BY a.glcode, a.accno
    ) o
    FULL OUTER JOIN
    (
      SELECT a.glcode, a.accno,
      SUM(
        CASE 
          WHEN a.trnstypeid <> 4 AND a.sourceid <> 7 
          THEN a.amount 
          ELSE 0 
        END
      ) AS receipt_amount
      FROM transview a
      WHERE a.ulbid = :ulbId
        AND a.amount > 0
        AND a.trnstypeid IN (3,4,5,8,9)
        AND a.sourceid <> 6
        AND TRUNC(a.trnsdate) BETWEEN TO_DATE(:fromDate,'DD-MON-YYYY')
        AND TO_DATE(:toDate,'DD-MON-YYYY')
  `;

  // 🔹 Party filter (receipt)
  if (filters.partycode) {
    sql += " AND a.partycode = :partycode ";
  }

  sql += `
      GROUP BY a.glcode, a.accno
    ) r
    ON o.glcode = r.glcode AND o.accno = r.accno

    FULL OUTER JOIN
    (
      SELECT a.glcode, a.accno,
      SUM(
        CASE 
          WHEN a.trnstypeid = 4 AND a.sourceid = 7 THEN a.amount
          WHEN a.trnstypeid IN (5,4) THEN a.amount
          ELSE 0 
        END
      ) * -1 AS payment_amount
      FROM transview a
      WHERE a.ulbid = :ulbId
        AND a.amount < 0
        AND a.trnstypeid IN (3,4,5,8,9)
        AND TRUNC(a.trnsdate) BETWEEN TO_DATE(:fromDate,'DD-MON-YYYY')
        AND TO_DATE(:toDate,'DD-MON-YYYY')
  `;

  // 🔹 Party filter (payment)
  if (filters.partycode) {
    sql += " AND a.partycode = :partycode ";
  }

  sql += `
      GROUP BY a.glcode, a.accno
    ) p
    ON NVL(o.glcode,r.glcode) = p.glcode 
    AND NVL(o.accno,r.accno) = p.accno
  )
  WHERE 1=1
  `;

  // 🔹 GL Filter (FINAL LEVEL)
  if (filters.glcode && filters.accno) {
    sql += " AND glcode = :glcode AND accno = :accno ";
    params.glcode = filters.glcode;
    params.accno = filters.accno;
  }

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);

  return result.rows[0];
}


module.exports = {
  getCashbookDetails,
  getCashbookSummary
};