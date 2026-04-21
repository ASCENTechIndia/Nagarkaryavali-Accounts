const { executeQuery } = require("../../../db/queryExecutor");

async function getGrampanchayatListRepo(deptId) {
  console.log("📤 Repo: Fetch Grampanchayat List", deptId);

  const sql = `
    SELECT 
      var_grampanch_marathiname AS grampanchname,
      num_grampanch_grampanchid AS grampanchid,
      num_grampanch_deptid AS deptid
    FROM aoac_grampanch_def
    WHERE num_grampanch_deptid = :deptId
  `;

  const result = await executeQuery(sql, { deptId });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getCashBankBalanceReportRepo(payload) {
  console.log("📤 Repo: Fetch Cash Bank Balance Report", payload);

  const { asOnDate, zoneId, ulbId } = payload;

  const sql = `
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
                    SELECT NVL(SUM(a.amount), 0)
                    FROM transview a
                    WHERE a.glcode = c.glcode
                      AND a.accno = c.accno
                      AND a.zoneid = :zoneId
                      AND TRUNC(a.trnsdate) <= TO_DATE(:asOnDate, 'YYYY-MM-DD')
                      AND a.ulbid = :ulbId
                )
            ), 0
        ) AS balance

    FROM accountview_web c

    WHERE c.accsubtypeid IN (4820, 4821, 4822, 4823, 17, 4829)
      AND c.ulbid = :ulbId

    GROUP BY 
        c.accsubtypeid,
        c.glcode,
        c.glname,
        c.accno,
        c.accname,
        c.objectcode,
        c.functioncode

    UNION ALL

    SELECT 
        c.accsubtypeid AS balscode,
        ' ' AS subtype,
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
                    SELECT NVL(SUM(a.amount), 0)
                    FROM transview a
                    WHERE a.glcode = c.glcode
                      AND a.accno = c.accno
                      AND a.zoneid = :zoneId
                      AND TRUNC(a.trnsdate) <= TO_DATE(:asOnDate, 'YYYY-MM-DD')
                      AND a.ulbid = :ulbId
                )
            ), 0
        ) AS balance

    FROM accountview_web c

    WHERE c.accsubtypeid IN (4810)
      AND c.ulbid = :ulbId

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

  const binds = { asOnDate, zoneId, ulbId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getDailyTransactionDetailedReport(filters) {
  const { date, ulbId, corpCode, budgetId, nidhiId, zone } = filters;

  let params = {
    reportDate: date,
    ulbId: ulbId
  };

  // ================= MBMC FILTER =================
  let mbmcFilter1 = "";
  let mbmcFilter2 = "";

  if (corpCode === "MBMC") {
    if (budgetId && budgetId !== 0) {
      mbmcFilter1 += " AND a.budgetid = :budgetId ";
      mbmcFilter2 += " AND num_trans_budgetid = :budgetId ";
      params.budgetId = budgetId;
    }
    if (nidhiId && nidhiId !== 0) {
      mbmcFilter1 += " AND a.nidhi_id = :nidhiId ";
      mbmcFilter2 += " AND num_trans_nidhiid = :nidhiId ";
      params.nidhiId = nidhiId;
    }
  }

  // ================= ZONE FILTER =================
  let zoneFilter1 = "";
  let zoneFilter2 = "";

  if (zone && zone !== "-1") {
    zoneFilter1 = " AND a.zoneid = :zone ";
    zoneFilter2 = " AND num_vchprepmst_zoneid = :zone ";
    params.zone = zone;
  } else {
    zoneFilter1 = " AND c.ulbid = :ulbId ";
    zoneFilter2 = " AND c.ulbid = :ulbId ";
  }

  const sql = `
  SELECT * FROM (

    /* ================= RECEIPTS ================= */
    SELECT 
      a.transno, a.trnsdate, a.docno, a.glcode, a.accno,
      a.narration,
      CASE WHEN a.trnstypeid = 1 THEN a.amount ELSE 0 END cashamount,
      CASE WHEN a.trnstypeid = 2 THEN a.amount ELSE 0 END bankamount,
      'R' AS TransType,
      TO_CHAR(a.chqno,'FM000000') chqno,
      CASE WHEN a.sourceid = 6 THEN a.amount ELSE 0 END transamount,
      v.zoneename,
      d.num_accdept_name grampanch,
      c.objectcode||' '||c.accname accname,
      p.var_partymst_partyname PartyName,
      NULL DelFlag,
      c.objectcode,
      c.functioncode

    FROM transview a
    INNER JOIN accountview_web c ON a.glcode=c.glcode AND a.accno=c.accno AND c.ulbid=a.ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid = a.partycode
    LEFT JOIN view_zone v ON v.zoneid = a.zoneid
    LEFT JOIN aoac_accdept_mst d ON d.num_accdept_id = a.accdept

    WHERE TRUNC(a.trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      AND a.amount>0
      AND (a.trnstypeid IN (1,2)
      OR (a.sourceid=6 AND c.accsubtypeid NOT IN (4820,4821,4822,4823,4829)))
      ${mbmcFilter1}
      ${zoneFilter1}

    UNION ALL

    /* ================= BANK PAYMENTS ================= */
    SELECT 
      num_vchprepmst_trnsno,
      date_trans_trnsdate,
      (SELECT DISTINCT TO_CHAR(num_vchtransbal_vchtransbalno)
       FROM aoac_vchtransbal_def 
       WHERE num_vchtransbal_transno=num_trans_transno),
      num_vchprepmst_drgl,
      num_vchprepmst_dracc,
      var_vchpremst_narration,
      0,
      SUM(num_vchgenmst_payamt),
      'P',
      TO_CHAR(num_trans_chqno,'FM000000'),
      0,
      NULL,NULL,
      c.objectcode||' '||c.accname,
      p.var_partymst_partyname,
      NULL,
      c.objectcode,
      c.functioncode

    FROM aoac_vchprepmst_def
    LEFT JOIN aoac_vchprepdet_def ON num_vchprepdet_refno=num_vchprepmst_refno
    INNER JOIN aoac_vchgenmst_def ON num_vchgenmst_refno=num_vchprepmst_refno
    INNER JOIN accountview_web c ON c.glcode=num_vchprepmst_drgl AND c.accno=num_vchprepmst_dracc AND c.ulbid=num_vchpremst_ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid=num_vchprepmst_partyid
    INNER JOIN aoac_trans_def ON num_vchprepmst_trnsno=num_trans_transno

    WHERE TRUNC(date_trans_trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      ${zoneFilter2}
      ${mbmcFilter2}

    GROUP BY num_vchprepmst_trnsno,date_trans_trnsdate,num_vchprepmst_vchno,
             num_vchprepmst_drgl,num_vchprepmst_dracc,
             var_vchpremst_narration,num_trans_chqno,
             c.objectcode,c.accname,c.functioncode,p.var_partymst_partyname,num_trans_transno

    UNION ALL

    /* ================= TRANSFER AMOUNT ================= */
    SELECT 
      num_vchprepmst_trnsno,
      date_trans_trnsdate,
      (SELECT DISTINCT TO_CHAR(num_vchtransbal_vchtransbalno)
       FROM aoac_vchtransbal_def 
       WHERE num_vchtransbal_transno=num_trans_transno),
      num_vchprepmst_drgl,
      num_vchprepmst_dracc,
      var_vchpremst_narration,
      0,
      0,
      'P',
      TO_CHAR(num_trans_chqno,'FM000000'),
      NVL(num_vchprepdet_amt,0),
      NULL,NULL,
      c.objectcode||' '||c.accname,
      p.var_partymst_partyname,
      NULL,
      c.objectcode,
      c.functioncode

    FROM aoac_vchprepmst_def
    LEFT JOIN aoac_vchprepdet_def ON num_vchprepdet_refno=num_vchprepmst_refno
    INNER JOIN accountview_web c ON c.glcode=num_vchprepdet_glcode AND c.accno=num_vchprepdet_accno AND c.ulbid=num_vchpremst_ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid=num_vchprepmst_partyid
    INNER JOIN aoac_trans_def ON num_vchprepmst_trnsno=num_trans_transno

    WHERE TRUNC(date_trans_trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      ${zoneFilter2}
      ${mbmcFilter2}

    UNION ALL

    /* ================= DIRECT PAYMENTS ================= */
    SELECT 
      a.transno,a.trnsdate,a.docno,a.glcode,a.accno,
      p.var_partymst_partyname||' '||c.accname||' '||a.narration,
      CASE WHEN a.trnstypeid=3 THEN a.amount ELSE 0 END,
      CASE WHEN a.trnstypeid=4 THEN a.amount ELSE 0 END,
      'P',
      TO_CHAR(a.chqno,'FM000000'),
      CASE WHEN a.trnstypeid=8 THEN a.amount ELSE 0 END,
      v.zoneename,d.num_accdept_name,
      c.objectcode||' '||c.accname,
      p.var_partymst_partyname,
      NULL,
      c.objectcode,
      c.functioncode

    FROM transview a
    INNER JOIN accountview_web c ON a.glcode=c.glcode AND a.accno=c.accno AND c.ulbid=a.ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid=a.partycode
    LEFT JOIN view_zone v ON v.zoneid=a.zoneid
    LEFT JOIN aoac_accdept_mst d ON d.num_accdept_id=a.accdept

    WHERE TRUNC(a.trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      AND a.amount<0 AND a.trnstypeid IN (3,4)
      ${mbmcFilter1}
      ${zoneFilter1}

    UNION ALL

    /* ================= TYPE 9 ================= */
    SELECT 
      a.transno,a.trnsdate,a.docno,a.glcode,a.accno,
      p.var_partymst_partyname||' '||c.accname||' '||a.narration,
      0,0,
      'P',
      TO_CHAR(a.chqno,'FM000000'),
      CASE WHEN a.trnstypeid=9 THEN a.amount ELSE 0 END,
      v.zoneename,d.num_accdept_name,
      c.objectcode||' '||c.accname,
      p.var_partymst_partyname,
      NULL,
      c.objectcode,
      c.functioncode

    FROM transview a
    INNER JOIN accountview_web c ON a.glcode=c.glcode AND a.accno=c.accno AND c.ulbid=a.ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid=a.partycode
    LEFT JOIN view_zone v ON v.zoneid=a.zoneid
    LEFT JOIN aoac_accdept_mst d ON d.num_accdept_id=a.accdept

    WHERE TRUNC(a.trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      AND a.amount>0 AND a.trnstypeid=9
      ${mbmcFilter1}
      ${zoneFilter1}

  )
  ORDER BY TransType DESC, transno, docno, transamount
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

module.exports = {
  getGrampanchayatListRepo,
  getCashBankBalanceReportRepo,
  getDailyTransactionDetailedReport
};