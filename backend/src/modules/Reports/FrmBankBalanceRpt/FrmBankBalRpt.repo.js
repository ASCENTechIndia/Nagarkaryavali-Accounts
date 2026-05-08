const { executeQuery } = require("../../../db/queryExecutor");


async function getAccountBalanceReport(filters) {

  let params = {
    ulbId: filters.ulbId,
    toDate: filters.toDate
  };

  let sql = `
    SELECT 
        c.accsubtypeid AS balscode,
        '' AS subtype,
        c.glcode,
        c.glname,
        c.accno,
        c.accname,
        c.objectcode,
        c.functioncode,

        NVL(SUM(
            c.openingbal + (
                SELECT NVL(SUM(a.amount),0)
                FROM transview a
                WHERE a.glcode = c.glcode
                  AND a.accno = c.accno
                  AND TRUNC(a.trnsdate) <= TO_DATE(:toDate,'DD-MON-YYYY')
                  AND a.ulbid = :ulbId
            )
        ),0) AS balance

    FROM accountview_web c
    WHERE c.accsubtypeid IN (4820,4821,4822,4823,17,4829,4810)
      AND c.ulbid = :ulbId
  `;

  if (filters.zoneId) {
    sql += ` AND c.zoneid = :zoneId `;
    params.zoneId = filters.zoneId;
  }

  sql += `
    GROUP BY 
      c.accsubtypeid,
      c.glcode,
      c.glname,
      c.accno,
      c.accname,
      c.objectcode,
      c.functioncode

    ORDER BY balscode, glcode, accno
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

async function getMonthlySummaryReport(filters) {

  const sql = `
    SELECT 
        trns_month,
        OpeningBal,
        SUM(Debit) AS Total_Debit,
        SUM(Credit) AS Total_Credit
    FROM (
        SELECT 
            TO_CHAR(TRUNC(t.trnsdate), 'MON-YYYY') AS Trns_Month,
            t.accno,
            NVL(a.openingbal,0) AS OpeningBal,

            CASE 
                WHEN t.amount < 0 THEN ABS(t.amount)
                ELSE 0
            END AS Debit,

            CASE 
                WHEN t.amount > 0 THEN t.amount
                ELSE 0
            END AS Credit

        FROM transview t

        LEFT OUTER JOIN accountview_web a
            ON t.glcode = a.glcode
           AND t.accno = a.accno
           AND a.ulbid = :ulbId

        WHERE t.glcode = :glcode
          AND t.accno = :accno
          AND t.ulbid = :ulbId
    )

    GROUP BY 
        trns_month,
        TO_DATE(trns_month,'MON-YYYY'),
        OpeningBal

    ORDER BY TO_DATE(trns_month,'MON-YYYY')
  `;

  const result = await executeQuery(sql, {
    ulbId: filters.ulbId,
    glcode: filters.glcode,
    accno: filters.accno
  });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

async function getDailySummaryReport(filters) {

  const sql = `
    SELECT 
        trns_date,
        OpeningBal,
        SUM(Debit) AS Daily_Debit,
        SUM(Credit) AS Daily_Credit

    FROM (
        SELECT 
            TRUNC(t.trnsdate) AS trns_date,
            t.accno,
            NVL(a.openingbal,0) AS OpeningBal,

            CASE 
                WHEN t.amount < 0 THEN ABS(t.amount)
                ELSE 0
            END AS Debit,

            CASE 
                WHEN t.amount > 0 THEN t.amount
                ELSE 0
            END AS Credit

        FROM transview t

        LEFT OUTER JOIN accountview_web a
            ON t.glcode = a.glcode
           AND t.accno = a.accno
           AND a.ulbid = :ulbId

        WHERE t.glcode = :glcode
          AND t.accno = :accno
          AND t.ulbid = :ulbId
          AND TRUNC(t.trnsdate)
              BETWEEN TO_DATE(:fromDate,'DD-MON-YYYY')
              AND TO_DATE(:toDate,'DD-MON-YYYY')
    )

    GROUP BY trns_date, OpeningBal
    ORDER BY trns_date
  `;

  const result = await executeQuery(sql, {
    ulbId: filters.ulbId,
    glcode: filters.glcode,
    accno: filters.accno,
    fromDate: filters.fromDate,
    toDate: filters.toDate
  });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

async function getTransactionDetailsReport(filters) {

  const sql = `
    SELECT 
        TRUNC(t.trnsdate) AS trnsdate,
        t.transno,
        t.docno,
        t.accno,
        a.accname,

        p.var_partymst_partyname || ' ' || t.narration AS narration,

        t.chqno,
        t.amount,
        TRUNC(t.chqdate) AS chqdate,

        CASE 
            WHEN t.amount < 0 THEN ABS(t.amount)
            ELSE 0
        END AS Debit,

        CASE 
            WHEN t.amount > 0 THEN t.amount
            ELSE 0
        END AS Credit,

        CASE 
            WHEN t.amount < 0 THEN 'DR'
            ELSE 'CR'
        END AS Type

    FROM transview t

    LEFT OUTER JOIN accountview_web a
        ON t.glcode = a.glcode
       AND t.accno = a.accno
       AND a.ulbid = :ulbId

    LEFT JOIN aoac_partymst_def p
        ON p.num_partymst_partyid = t.partycode

    WHERE t.glcode = :glcode
      AND t.accno = :accno
      AND t.ulbid = :ulbId

      AND TRUNC(t.trnsdate)
          BETWEEN TO_DATE(:fromDate,'DD-MON-YYYY')
          AND TO_DATE(:toDate,'DD-MON-YYYY')

    ORDER BY trnsdate, t.transno
  `;

  const result = await executeQuery(sql, {
    ulbId: filters.ulbId,
    glcode: filters.glcode,
    accno: filters.accno,
    fromDate: filters.fromDate,
    toDate: filters.toDate
  });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

async function getSingleAccountBalance(filters) {

  const sql = `
    SELECT 
        NVL(SUM(
            c.openingbal + (
                SELECT NVL(SUM(a.amount),0)
                FROM transview a
                WHERE a.glcode = c.glcode
                  AND a.accno = c.accno
                  AND TRUNC(a.trnsdate) <= TO_DATE(:toDate,'DD-MON-YYYY')
                  AND a.glcode = :glcode
                  AND a.accno = :accno
            )
        ),0) AS balance

    FROM accountview_web c

    WHERE c.glcode = :glcode
      AND c.accno = :accno
  `;

  const result = await executeQuery(sql, {
    toDate: filters.toDate,
    glcode: filters.glcode,
    accno: filters.accno
  });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}


module.exports = {
  getAccountBalanceReport,
  getMonthlySummaryReport,
  getDailySummaryReport,
  getTransactionDetailsReport,
  getSingleAccountBalance
};