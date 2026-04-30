const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");


async function getBudgetExpenditureReport(filters) {
  const isReceipt = filters.rptType === "0";

  let params = {
    ulbId: filters.ulbId,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };

  let sql = "";

  // =========================
  // ✅ RECEIPT (CORRECT)
  // =========================
  if (isReceipt) {
    sql = `
      SELECT 
        a.glcode,
        acc.glname,
        a.accno,
        acc.accname AS ACCNAME,
        NVL(budgetamt, 0) AS BUDGPROV,
        acc.functioncode,
        acc.objectcode AS ACCOUNTCODE,
        SUM(a.amount) AS ACTUAL_PAYMENT,
        SUM(a.amount) AS EXPENDITURE,
        NVL(budgetamt, 0) - SUM(a.amount) AS BALANCE

      FROM transview a
      INNER JOIN accountview_web acc 
        ON acc.glcode = a.glcode 
       AND acc.accno = a.accno 
       AND acc.ulbid = a.ulbid

      LEFT JOIN aoac_budgetaccmap_det 
        ON num_budgetaccmap_glcode = a.glcode
       AND num_budgetaccmap_accountno = a.accno
       AND num_budgetaccmap_ulbid = a.ulbid

      WHERE 
        a.trnsdate BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') 
                        AND TO_DATE(:toDate, 'DD-MON-YYYY')
        AND a.ulbid = :ulbId
        AND a.amount > 0
        AND a.trnstypeid IN (1, 2)
    `;

    // ✅ Zone filter
    if (filters.zoneId && filters.zoneId !== "-1") {
      sql += ` AND a.zoneid = :zoneId `;
      params.zoneId = filters.zoneId;
    }

    sql += `
      GROUP BY 
        a.glcode,
        acc.glname,
        a.accno,
        acc.accname,
        budgetamt,
        acc.functioncode,
        acc.objectcode
    `;
  }

  // =========================
  // ✅ EXPENDITURE (CORRECT)
  // =========================
  else {
    sql = `
      SELECT 
        glcode,
        glname,
        accno,
        accname,
        budgprov,
        accountcode,
        SUM(actual_payment) AS actual_payment,
        SUM(expenditure) AS expenditure,
        SUM(balance) AS balance,
        SUM(progressive_total) AS progressive_total,
        accno_type_no,
        accno_type_name,
        functioncode

      FROM (
        SELECT 
          a.glcode,
          acc.glname,
          a.accno,
          acc.accname,
          NVL(budgetamt, 0) AS budgprov,
          acc.functioncode,
          acc.objectcode AS accountcode,

          /* ACTUAL PAYMENT */
          (
            NVL((
              SELECT SUM(d.num_vchtransbaldet_amount * -1)
              FROM aoac_vchtransbal_def vb
              INNER JOIN aoac_vchtransbaldet_def d
                ON d.num_vchtransbaldet_transno = vb.num_vchtransbal_vchtransbalno
               AND d.num_vchtransbaldet_vchrefno = vb.num_vchtransbal_vchrefno
              WHERE vb.num_vchtransbal_transno = a.transno
                AND d.num_vchtransbaldet_accno = a.accno
                AND d.num_vchtransbaldet_amount < 0
            ), 0)
            +
            NVL((
              SELECT SUM(d.num_vchtransbaldet_amount)
              FROM aoac_vchtransbal_def vb
              INNER JOIN aoac_vchtransbaldet_def d
                ON d.num_vchtransbaldet_transno = vb.num_vchtransbal_vchtransbalno
               AND d.num_vchtransbaldet_vchrefno = vb.num_vchtransbal_vchrefno
              WHERE vb.num_vchtransbal_transno = a.transno
                AND vb.num_vchtransbal_accno = a.accno
                AND d.num_vchtransbaldet_amount > 0
            ), 0)
          ) AS actual_payment,

          /* EXPENDITURE */
          SUM(a.amount) AS expenditure,

          NVL(budgetamt, 0) - SUM(a.amount) AS balance,

          /* PROGRESSIVE TOTAL */
          NVL(ABS((
            SELECT 
              NVL(SUM(b.amount), 0)
            FROM transview b
            WHERE 
              b.trnsdate BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') 
                              AND TO_DATE(:toDate, 'DD-MON-YYYY')
              AND b.trnstypeid IN (1, 2, 4)
              AND b.glcode = a.glcode
              AND b.accno = a.accno
          )), 0) AS progressive_total,

          /* ACCOUNT TYPE */
          CASE 
            WHEN SUBSTR(acc.objectcode, 4, 1) = '2' THEN '2'
            WHEN SUBSTR(acc.objectcode, 4, 1) = '3' THEN '3'
            WHEN SUBSTR(acc.objectcode, 4, 1) = '4' THEN '4'
          END AS accno_type_no,

          CASE 
            WHEN SUBSTR(acc.objectcode, 4, 1) = '2' THEN 'खर्च'
            WHEN SUBSTR(acc.objectcode, 4, 1) = '3' THEN 'दायित्व'
            WHEN SUBSTR(acc.objectcode, 4, 1) = '4' THEN 'मत्ता'
          END AS accno_type_name

        FROM transview a
        INNER JOIN accountview_web acc 
          ON acc.glcode = a.glcode 
         AND acc.accno = a.accno 
         AND acc.ulbid = a.ulbid

        LEFT JOIN aoac_budgetaccmap_det 
          ON num_budgetaccmap_glcode = a.glcode
         AND num_budgetaccmap_accountno = a.accno
         AND num_budgetaccmap_ulbid = a.ulbid

        WHERE 
          a.trnsdate BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') 
                          AND TO_DATE(:toDate, 'DD-MON-YYYY')
          AND a.ulbid = :ulbId
          AND a.sourceid IN (6)
          AND a.amount < 0
          AND acc.accsubtypeid NOT IN (1, 2)
          AND a.accno NOT IN ('4148100001','4148210004')
          AND acc.accsubtypeid NOT IN (4820, 4821)
    `;

    // ✅ Zone filter
    if (filters.zoneId && filters.zoneId !== "-1") {
      sql += ` AND a.zoneid = :zoneId `;
      params.zoneId = filters.zoneId;
    }

    sql += `
        GROUP BY 
          a.transno,
          a.glcode,
          acc.glname,
          a.accno,
          acc.accname,
          budgetamt,
          acc.functioncode,
          acc.objectcode
      )
      WHERE accno_type_no IS NOT NULL
      GROUP BY 
        glcode,
        glname,
        accno,
        accname,
        budgprov,
        accountcode,
        accno_type_no,
        accno_type_name,
        functioncode
      ORDER BY accno_type_no
    `;
  }

  const result = await executeQuery(sql, params);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

async function getTransactionLedgerReport(filters) {
  let params = {
    ulbId: filters.ulbId,
    fromDate: filters.fromDate, // Format: 'DD-MON-YYYY'
    toDate: filters.toDate
  };

  let sql = `
    SELECT 
      a.trnsdate, 
      a.transno, 
      a.docno, 
      a.glcode, 
      acc.glname, 
      a.accno, 
      acc.accname, 
      vz.zoneename AS deptname, 
      agd.var_grampanch_grampanch AS grampanch,
      CASE WHEN a.amount > 0 THEN a.amount ELSE 0 END AS credit, 
      CASE WHEN a.amount < 0 THEN a.amount * -1 ELSE 0 END AS debit,
      0 AS BudgetCode,
      acc.functioncode,
      acc.objectcode
    FROM transview a
    INNER JOIN accountview_web acc ON a.glcode = acc.glcode AND a.accno = acc.accno AND acc.ulbid = a.ulbid
    INNER JOIN view_zone vz ON vz.zoneid = a.zoneid
    LEFT OUTER JOIN aoac_grampanch_def agd ON agd.num_grampanch_grampanchid = a.grampanchid
    LEFT OUTER JOIN aoac_partymst_def apd ON apd.num_partymst_partyid = a.partycode
    WHERE a.trnsdate >= TO_DATE(:fromDate, 'DD-MON-YYYY') 
      AND a.trnsdate <= TO_DATE(:toDate, 'DD-MON-YYYY')
      AND a.ulbid = :ulbId
  `;

  // Dynamic Transaction Type Filter
  if (filters.trnsType && filters.trnsType !== "0") {
    // Note: If trnsType is a comma-separated string, use caution with binding.
    // For a single ID, this works perfectly:
    sql += " AND a.trnstypeid = :trnsType ";
    params.trnsType = filters.trnsType;
  }

  // Dynamic Zone Filter
  if (filters.zoneId && filters.zoneId !== "-1") {
    sql += " AND a.zoneid = :zoneId ";
    params.zoneId = filters.zoneId;
  }

  // MBMC Specific Nidhi/Budget Filters
  if (filters.corpCode === "MBMC") {
    if (filters.budgetId && filters.budgetId !== "-1") {
      sql += " AND a.budgetid = :budgetId ";
      params.budgetId = filters.budgetId;
    }
    if (filters.nidhiId && filters.nidhiId !== "-1") {
      sql += " AND a.nidhi_id = :nidhiId ";
      params.nidhiId = filters.nidhiId;
    }
  }

  sql += " ORDER BY a.trnsdate, a.transno, a.amount DESC ";

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);
  return result.rows;
}

module.exports = {
    getBudgetExpenditureReport,
    getTransactionLedgerReport,

};