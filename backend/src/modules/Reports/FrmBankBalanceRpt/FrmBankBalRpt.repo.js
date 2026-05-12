const { executeQuery } = require("../../../db/queryExecutor");


async function getAccountBalanceReport(filters) {

  let params = {
    ulbId: filters.ulbId,
    toDate: filters.toDate
  };

  let sql = `

    /* ================= FIRST QUERY ================= */

    SELECT
        c.accsubtypeid AS balscode,
        '' AS subtype,
        c.glcode,
        c.glname,
        c.accno,
        c.accname,
        c.objectcode,
        c.functioncode,

        NVL(
            SUM(
                c.openingbal +
                (
                    SELECT NVL(SUM(a.amount),0)
                    FROM transview a
                    WHERE a.glcode = c.glcode
                      AND a.accno  = c.accno
                      AND TRUNC(a.trnsdate) <= TO_DATE(:toDate,'DD-MON-YYYY')
                      AND a.ulbid = :ulbId
  `;

  // zone condition inside subquery
  if (filters.zoneId && filters.zoneId !== "-1") {
    sql += ` AND a.zoneid = :zoneId `;
    params.zoneId = filters.zoneId;
  }

  sql += `
                )
            ),
        0) AS balance

    FROM accountview_web c

    WHERE c.accsubtypeid IN (4820,4821,4822,4823,17,4829)
  `;

  // main query zone logic
  if (filters.zoneId && filters.zoneId !== "-1") {
    sql += ` AND c.zoneid = :zoneId `;
  } else {
    sql += ` AND c.ulbid = :ulbId `;
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

    UNION ALL

    /* ================= SECOND QUERY ================= */

    SELECT
        c.accsubtypeid AS balscode,
        '' AS subtype,
        c.glcode,
        c.glname,
        c.accno,
        c.accname,
        c.objectcode,
        c.functioncode,

        NVL(
            SUM(
                c.openingbal +
                (
                    SELECT NVL(SUM(a.amount),0)
                    FROM transview a
                    WHERE a.glcode = c.glcode
                      AND a.accno  = c.accno
                      AND TRUNC(a.trnsdate) <= TO_DATE(:toDate,'DD-MON-YYYY')
                      AND a.ulbid = :ulbId
  `;

  // zone condition inside second subquery
  if (filters.zoneId && filters.zoneId !== "-1") {
    sql += ` AND a.zoneid = :zoneId `;
  }

  sql += `
                )
            ),
        0) AS balance

    FROM accountview_web c

    WHERE c.accsubtypeid IN (4810)
  `;

  // second main query zone logic
  if (filters.zoneId && filters.zoneId !== "-1") {
    sql += ` AND c.zoneid = :zoneId `;
  } else {
    sql += ` AND c.ulbid = :ulbId `;
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

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getMonthlySummaryReport(filters) {

  let params = {
    glcode: filters.glcode,
    accno: filters.accno
  };

  let sql = `

    SELECT
        trns_month,
        OpeningBal,
        SUM(Debit) AS Debit,
        SUM(Credit) AS Credit

    FROM (

        SELECT
            TO_CHAR(TRUNC(t.trnsdate), 'MON-YYYY') AS trns_month,
            t.accno,

            NVL(a.openingbal,0) AS OpeningBal,

            CASE
                WHEN t.amount < 0 THEN t.amount
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

        WHERE t.glcode = :glcode
          AND t.accno  = :accno
  `;

  // zone filter
  if (filters.zoneId && filters.zoneId !== "-1" && filters.zoneId !== "0") {
    sql += ` AND a.zoneid = :zoneId `;
    params.zoneId = filters.zoneId;
  }

  // grampanchayat filter
  if (filters.grampanchId && filters.grampanchId !== "0") {
    sql += ` AND t.grampanchid = :grampanchId `;
    params.grampanchId = filters.grampanchId;
  }

  sql += `
    )

    GROUP BY
        trns_month,
        TO_DATE(trns_month,'MON-YYYY'),
        OpeningBal

    ORDER BY TO_DATE(trns_month,'MON-YYYY')
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getDailySummaryReport(filters) {

  let params = {
    glcode: filters.glcode,
    accno: filters.accno,
    fromDate: filters.fromDate,
    toDate: filters.toDate
  };

  let sql = `

    SELECT
        trns_date,
        OpeningBal,
        SUM(Debit) AS Debit,
        SUM(Credit) AS Credit

    FROM (

        SELECT
            TRUNC(t.trnsdate) AS trns_date,
            t.accno,

            NVL(a.openingbal,0) AS OpeningBal,

            CASE
                WHEN t.amount < 0 THEN t.amount
                ELSE 0
            END AS Debit,

            CASE
                WHEN t.amount > 0 THEN t.amount
                ELSE 0
            END AS Credit

        FROM transview t

        LEFT OUTER JOIN accountview_web a
            ON t.glcode = a.glcode
           AND t.accno  = a.accno

        WHERE t.glcode = :glcode
          AND t.accno  = :accno

          AND (
                TRUNC(t.trnsdate) >= TO_DATE(:fromDate,'DD-MON-YYYY')
            AND TRUNC(t.trnsdate) <= TO_DATE(:toDate,'DD-MON-YYYY')
          )
  `;

  // zone filter
  if (filters.zoneId && filters.zoneId !== "0" && filters.zoneId !== "-1") {
    sql += ` AND a.zoneid = :zoneId `;
    params.zoneId = filters.zoneId;
  }

  // grampanchayat filter
  if (filters.grampanchId && filters.grampanchId !== "0") {
    sql += ` AND t.grampanchid = :grampanchId `;
    params.grampanchId = filters.grampanchId;
  }

  sql += `

    )

    GROUP BY
        trns_date,
        OpeningBal

    ORDER BY trns_date
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getTransactionDetailsReport(filters) {

  let params = {
    glcode: filters.glcode,
    accno: filters.accno,
    fromDate: filters.fromDate,
    toDate: filters.toDate
  };

  let sql = `

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
            WHEN t.amount < 0 THEN t.amount
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
       AND t.accno  = a.accno

    LEFT JOIN aoac_partymst_def p
        ON p.num_partymst_partyid = t.partycode

    WHERE t.glcode = :glcode
      AND t.accno  = :accno

      AND (
            TRUNC(t.trnsdate) >= TO_DATE(:fromDate,'DD-MON-YYYY')
        AND TRUNC(t.trnsdate) <= TO_DATE(:toDate,'DD-MON-YYYY')
      )
  `;

  // zone filter
  if (filters.zoneId && filters.zoneId !== "0") {
    sql += ` AND t.zoneid = :zoneId `;
    params.zoneId = filters.zoneId;
  }

  // grampanchayat filter
  if (filters.grampanchId && filters.grampanchId !== "0") {
    sql += ` AND t.grampanchid = :grampanchId `;
    params.grampanchId = filters.grampanchId;
  }

  sql += `
    ORDER BY trnsdate, t.transno
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getSingleAccountBalance(filters) {

  const sql = `

    SELECT
        NVL(
            SUM(
                c.openingbal +
                (
                    SELECT NVL(SUM(a.amount),0)
                    FROM transview a
                    WHERE a.glcode = c.glcode
                      AND a.accno  = c.accno
                      AND TRUNC(a.trnsdate) <= TO_DATE(:toDate,'DD-MON-YYYY')
                )
            ),
        0) AS balance

    FROM accountview_web c

    WHERE c.glcode = :glcode
      AND c.accno  = :accno
  `;

  const result = await executeQuery(sql, {
    toDate: filters.toDate,
    glcode: filters.glcode,
    accno: filters.accno
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


module.exports = {
  getAccountBalanceReport,
  getMonthlySummaryReport,
  getDailySummaryReport,
  getTransactionDetailsReport,
  getSingleAccountBalance
};