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

  if (isReceipt) {
    // ✅ RECEIPT
    sql = `
      SELECT 
        a.glcode, acc.glname, a.accno, acc.accname AS ACCNAME, 
        NVL(acc.budgetamt, 0) AS BUDGPROV,
        acc.functioncode, acc.objectcode AS ACCOUNTCODE,
        SUM(a.amount) AS ACTUAL_PAYMENT, 
        SUM(a.amount) AS EXPENDITURE, 
        NVL(acc.budgetamt, 0) - SUM(a.amount) AS BALANCE
      FROM transview a 
      INNER JOIN accountview_web acc 
        ON acc.glcode = a.glcode 
       AND acc.accno = a.accno 
       AND acc.ulbid = a.ulbid

      WHERE a.trnsdate >= TO_DATE(:fromDate, 'DD-MON-YYYY') 
        AND a.trnsdate <= TO_DATE(:toDate, 'DD-MON-YYYY')
        AND a.ulbid = :ulbId
        AND (a.trnstypeid IN (1, 2) OR (a.trnstypeid = 4 AND a.amount > 0))
        AND acc.accsubtypeid NOT IN (1, 2)
        AND a.accno NOT IN ('4148100001', '4148210004')
        AND acc.accsubtypeid NOT IN (4820, 4821, 2110, 2272)
    `;

  } else {
    // ✅ EXPENDITURE
    params.finYearStart = filters.finYearStart || "01-APR-2025";

    sql = `
      SELECT 
        a.glcode, acc.glname, a.accno, acc.accname AS ACCNAME, 
        NVL(acc.budgetamt, 0) AS BUDGPROV,
        acc.functioncode, acc.objectcode AS ACCOUNTCODE,
        SUM(a.amount) AS ACTUAL_PAYMENT, 
        SUM(a.amount) AS EXPENDITURE, 
        NVL(acc.budgetamt, 0) - SUM(a.amount) AS BALANCE,

        ABS((
          SELECT NVL(SUM(b.amount), 0)
          FROM transview b 
          WHERE b.trnsdate <= TO_DATE(:toDate, 'DD-MON-YYYY') 
            AND b.trnsdate >= TO_DATE(:finYearStart, 'DD-MON-YYYY')
            AND b.trnstypeid IN (1, 2, 4)
            AND b.glcode = a.glcode 
            AND b.accno = a.accno
        )) AS progressive_total

      FROM transview a 
      INNER JOIN accountview_web acc 
        ON acc.glcode = a.glcode 
       AND acc.accno = a.accno 
       AND acc.ulbid = a.ulbid

      WHERE a.trnsdate >= TO_DATE(:fromDate, 'DD-MON-YYYY') 
        AND a.trnsdate <= TO_DATE(:toDate, 'DD-MON-YYYY')
        AND a.ulbid = :ulbId
        AND a.trnstypeid IN (3, 4) 
        AND a.amount < 0
        AND acc.accsubtypeid NOT IN (1, 2)
        AND a.accno NOT IN ('4148100001', '4148210004')
        AND acc.accsubtypeid NOT IN (4820, 4821)
    `;
  }

  // ✅ Optional Zone Filter (SAFE)
  if (filters.zoneId && filters.zoneId !== "-1") {
    sql += " AND a.zoneid = :zoneId ";
    params.zoneId = filters.zoneId;
  }

  sql += `
    GROUP BY 
      a.glcode, acc.glname, a.accno, acc.accname,
      acc.budgetamt, acc.functioncode, acc.objectcode
  `;

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