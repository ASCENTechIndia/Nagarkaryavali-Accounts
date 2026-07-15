const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");


async function getTransactionReport(filters) {
  let params = {
    ulbId: filters.ulbId,
    fromDate: filters.fromDate,
    toDate: filters.toDate
  };



  let sql = `
    SELECT a.trnsdate, a.transno, a.docno, a.glcode, acc.glname, a.accno, acc.accname, d.deptname,
           vz.zoneename, agd.var_grampanch_grampanch AS grampanch, a.amount, 
           a.narration, apd.var_partymst_partyname AS partyname, 
           0 AS BudgetCode, acc.functioncode, acc.objectcode, a.nidhi_id
    FROM transview a
    INNER JOIN accountview_web acc ON a.glcode = acc.glcode AND a.accno = acc.accno AND acc.ulbid = a.ulbid
    INNER JOIN aoac_receiptmst_def arm ON arm.num_receiptmst_trnsno = a.transno AND arm.num_receiptmst_ulbid = a.ulbid
    LEFT JOIN vw_accdeptconfig d ON d.deptid = arm.num_receiptmst_deptid AND d.ulbid = arm.num_receiptmst_ulbid
    LEFT JOIN view_zone vz ON vz.zoneid = a.zoneid
    LEFT OUTER JOIN aoac_grampanch_def agd ON agd.num_grampanch_grampanchid = a.grampanchid
    LEFT OUTER JOIN aoac_partymst_def apd ON apd.num_partymst_partyid = a.partycode
    WHERE TRUNC(a.trnsdate) >= TO_DATE(:fromDate, 'YYYY-MM-DD') 
      AND TRUNC(a.trnsdate) <= TO_DATE(:toDate, 'YYYY-MM-DD')
      AND a.ulbid = :ulbId
      AND a.amount > 0
      AND (a.trnstypeid IN (1, 2) OR (a.sourceid = 6 AND acc.accsubtypeid NOT IN (4810,4820,4821,4822,4823)))
  `;

  // Dynamic non-compulsory conditions
  if (filters.majorCode && !filters.minorCode) {
    sql += ` AND a.glcode = :majorCode `;
    params.majorCode = filters.majorCode;
  } else if (filters.majorCode && filters.minorCode) {
    sql += ` AND acc.functioncode = :majorCode AND acc.objectcode = :minorCode `;
    params.majorCode = filters.majorCode;
    params.minorCode = filters.minorCode;
  }

  if (filters.zoneId && filters.zoneId > 0) {
    sql += ` AND a.zoneid = :zoneId `;
    params.zoneId = filters.zoneId;
  }

  if (filters.gramPanchayatId && filters.gramPanchayatId > 0) {
    sql += ` AND a.grampanchid = :gpId `;
    params.gpId = filters.gramPanchayatId;
  }

  const hasDepartment =
    filters.department &&
    filters.department !== "-1" &&
    filters.department !== "" &&
    filters.department !== null &&
    filters.department !== undefined;

  if (hasDepartment) {
    sql += ` AND arm.num_receiptmst_deptid = :department`;
    params.department = filters.department;
  }

  // MBMC Specific
  if (filters.corpCode === "MBMC") {
    if (filters.budgetId && filters.budgetId !== "-1") {
      sql += ` AND a.budgetid = :budgetId `;
      params.budgetId = filters.budgetId;
    }
    if (filters.nidhiId && filters.nidhiId !== "-1") {
      sql += ` AND a.nidhi_id = :nidhiId `;
      params.nidhiId = filters.nidhiId;
    }
  }

  sql += ` ORDER BY a.trnsdate, a.transno `;

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);
  return result.rows;
}
async function getNidhiConfig(budgetId, ulbId) {
  const sql = `
    SELECT nidhiname, nidhiid 
    FROM vw_nidhi_config
    WHERE budgetid = :budgetId 
      AND nidhiflag = 'Y' 
      AND ulbid = :ulbId
    ORDER BY nidhiname
  `;

  const result = await executeQuery(sql, { budgetId, ulbId });
  if (!result.success) throw new Error(result.error);
  return result.rows;
}

async function getDailyTransactionReport(filters) {
  let params = {
    ulbId: filters.ulbId,
    trnsDate: filters.trnsDate, // format: DD-MON-YYYY
  };

  const sql = `
   
    SELECT a.transno, a.trnsdate, a.docno, a.glcode, a.accno, a.narration,
           CASE WHEN a.trnstypeid = 1 THEN a.amount ELSE 0 END AS cashamount,
           CASE WHEN a.trnstypeid = 2 THEN a.amount ELSE 0 END AS bankamount,
           'R' AS transtype,
           TO_CHAR(a.chqno, 'FM000000') AS chqno,
           CASE WHEN a.sourceid = 6 THEN a.amount ELSE 0 END AS transamount,
           zoneename AS zonename,
           num_accdept_name AS grampanch,
           c.objectcode || ' ' || c.accname AS accname,
           var_partymst_partyname AS partyname,
           NULL AS delflag,
           c.objectcode,
           c.functioncode
    FROM transview a
    INNER JOIN accountview_web c 
      ON a.glcode = c.glcode AND a.accno = c.accno AND c.ulbid = a.ulbid
    LEFT JOIN aoac_partymst_def 
      ON num_partymst_partyid = partycode
    LEFT JOIN view_zone v 
      ON v.zoneid = a.zoneid
    LEFT OUTER JOIN aoac_accdept_mst 
      ON num_accdept_id = accdept
    WHERE TRUNC(a.trnsdate) = TO_DATE(:trnsDate, 'DD-MON-YYYY')
      AND a.ulbid = :ulbId
      AND a.amount > 0
      AND (a.trnstypeid IN (1, 2) OR (a.sourceid = 6 AND c.accsubtypeid NOT IN (4820,4821,4822,4823,4829)))

    UNION ALL


    SELECT num_vchprepmst_trnsno AS transno,
           date_trans_trnsdate AS trnsdate,
           (SELECT DISTINCT TO_CHAR(num_vchtransbal_vchtransbalno) 
            FROM aoac_vchtransbal_def 
            WHERE num_vchtransbal_transno = num_trans_transno) AS docno,
           num_vchprepmst_drgl AS glcode,
           num_vchprepmst_dracc AS accno,
           var_vchpremst_narration AS narration,
           0 AS cashamount,
           SUM(num_vchgenmst_payamt) AS bankamount,
           'P' AS transtype,
           TO_CHAR(num_trans_chqno, 'FM000000') AS chqno,
           0 AS transamount,
           NULL AS zonename,
           NULL AS grampanch,
           c.objectcode || ' ' || c.accname AS accname,
           var_partymst_partyname AS partyname,
           NULL AS delflag,
           c.objectcode,
           c.functioncode
    FROM aoac_vchprepmst_def
    LEFT JOIN aoac_vchprepdet_def 
      ON num_vchprepdet_refno = num_vchprepmst_refno
    INNER JOIN aoac_vchgenmst_def 
      ON num_vchgenmst_refno = num_vchprepmst_refno
    INNER JOIN accountview_web c 
      ON c.glcode = num_vchprepmst_drgl 
     AND c.accno = num_vchprepmst_dracc 
     AND c.ulbid = num_vchpremst_ulbid
    LEFT JOIN aoac_partymst_def 
      ON num_partymst_partyid = num_vchprepmst_partyid
    INNER JOIN aoac_trans_def 
      ON num_vchprepmst_trnsno = num_trans_transno
    WHERE TRUNC(date_trans_trnsdate) = TO_DATE(:trnsDate, 'DD-MON-YYYY')
      AND num_vchpremst_ulbid = :ulbId
    GROUP BY num_vchprepmst_trnsno, date_trans_trnsdate,
             num_vchprepmst_drgl, num_vchprepmst_dracc,
             var_vchpremst_narration, num_trans_chqno,
             c.objectcode, c.functioncode,
             c.objectcode || ' ' || c.accname,
             var_partymst_partyname, num_trans_transno

    UNION ALL


    SELECT a.transno, a.trnsdate, a.docno, a.glcode, a.accno,
           var_partymst_partyname || ' ' || c.accname || ' ' || a.narration,
           CASE WHEN a.trnstypeid = 3 THEN a.amount ELSE 0 END,
           CASE WHEN a.trnstypeid = 4 THEN a.amount ELSE 0 END,
           'P',
           TO_CHAR(a.chqno, 'FM000000'),
           CASE WHEN a.trnstypeid = 8 THEN a.amount ELSE 0 END,
           zoneename,
           num_accdept_name,
           c.objectcode || ' ' || c.accname,
           var_partymst_partyname,
           NULL,
           c.objectcode,
           c.functioncode
    FROM transview a
    INNER JOIN accountview_web c 
      ON a.glcode = c.glcode AND a.accno = c.accno AND c.ulbid = a.ulbid
    LEFT JOIN aoac_partymst_def 
      ON num_partymst_partyid = partycode
    LEFT JOIN view_zone v 
      ON v.zoneid = a.zoneid
    LEFT OUTER JOIN aoac_accdept_mst 
      ON num_accdept_id = accdept
    WHERE TRUNC(a.trnsdate) = TO_DATE(:trnsDate, 'DD-MON-YYYY')
      AND a.ulbid = :ulbId
      AND a.amount < 0
      AND a.trnstypeid IN (3, 4)
      AND a.sourceid <> 6

    ORDER BY transtype DESC, transno, docno, transamount
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

async function getOpeningBalance(filters) {
  // Define the Account SubType IDs based on your Enum
  const cashBankSubTypes = [4821, 4822, 4823, 4830, 4810, 4820];

  // Params object for binding
  let params = {
    ulbId: filters.ulbId,
    trnsDate: filters.trnsDate // Format: 'DD-MON-YYYY'
  };

  // Common Zone filter logic
  let zoneFilter = "";
  if (filters.zone && filters.zone !== "-1") {
    zoneFilter = " AND a.zoneid = :zoneId";
    params.zoneId = filters.zone;
  }

  const sql = `
    SELECT (bal.balance + rec.Receiptamt - pay.amount) AS closing_balance
    FROM (
      /* 1. Sum of Opening Balances for Cash/Bank Accounts */
      SELECT NVL(SUM(openingbal), 0) AS balance 
      FROM accountview_web 
      WHERE accsubtypeid IN (${cashBankSubTypes.join(',')}) 
        AND ulbid = :ulbId
    ) bal,
    (
      /* 2. Sum of specific account amounts (Subtype 4829) up to date */
      SELECT NVL(SUM(c.amount), 0) AS amount 
      FROM transview c
      INNER JOIN accountview_web a ON a.glcode = c.glcode AND a.accno = c.accno AND c.ulbid = a.ulbid
      WHERE a.accsubtypeid IN (4829) 
        AND c.ulbid = :ulbId 
        AND TRUNC(c.trnsdate) <= TO_DATE(:trnsDate, 'DD-MON-YYYY')
        ${filters.zone && filters.zone !== "-1" ? " AND c.zoneid = :zoneId" : ""}
    ) pay,
    (
      /* 3. Sum of Receipts (Positive amounts) linked to Cash/Bank accounts */
      SELECT NVL(SUM(a.amount), 0) AS Receiptamt 
      FROM transview a 
      INNER JOIN accountview_web c ON a.glcode = c.glcode AND a.accno = c.accno
      WHERE TRUNC(a.trnsdate) <= TO_DATE(:trnsDate, 'DD-MON-YYYY') 
        AND c.ulbid = :ulbId
        ${zoneFilter}
        AND a.transno IN (
          SELECT sub_a.transno 
          FROM transview sub_a 
          INNER JOIN accountview_web sub_c ON sub_a.glcode = sub_c.glcode AND sub_a.accno = sub_c.accno
          WHERE TRUNC(sub_a.trnsdate) <= TO_DATE(:trnsDate, 'DD-MON-YYYY') 
            AND sub_c.accsubtypeid IN (${cashBankSubTypes.join(',')}) 
            AND sub_c.ulbid = :ulbId
        )
        AND a.amount > 0
    ) rec
  `;

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);

  // Return the single balance value
  return result.rows.length > 0 ? result.rows[0].CLOSING_BALANCE : 0;
}

module.exports = {
  getDailyTransactionReport,
  getOpeningBalance,
  getTransactionReport,
  getNidhiConfig,
};