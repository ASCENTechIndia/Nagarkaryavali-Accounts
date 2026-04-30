const { executeQuery } = require("../../../db/queryExecutor");

const getPaymentRegister = async (params) => {
  try {
    let query = "";
    let bindParams = {
      FromDate: params.fromDate,
      ToDate: params.toDate,
      UlbId: params.ulbId
    };

    // ================= DETAIL (rptType = 1) =================
    if (params.rptType === "1") {
      query = `
        SELECT 
          TRUNC(a.trnsdate) trnsdate,
          a.glcode,
          acc.glname,
          a.accno,
          UTL_RAW.CAST_TO_VARCHAR2(
            HEXTORAW(REPLACE(RAWTOHEX(acc.accname),'2808DE',''))
          ) accname,
          zoneename deptname,
          acc.functioncode,
          acc.objectcode,
          ${params.chkGramPanchayat ? "var_grampanch_grampanch" : "NULL"} AS grampanch,
          SUM(a.amount) amount,
          0 BudgetCode
        FROM transview a
        INNER JOIN accountview_web acc 
          ON a.glcode = acc.glcode 
          AND a.accno = acc.accno 
          AND acc.ulbid = a.ulbid
        LEFT JOIN view_zone vz 
          ON vz.zoneid = a.zoneid
        LEFT JOIN aoac_grampanch_def 
          ON num_grampanch_grampanchid = a.grampanchid
        LEFT JOIN aoac_partymst_def 
          ON num_partymst_partyid = a.partycode
        WHERE 
          a.trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
          AND a.trnsdate <= TO_DATE(:ToDate,'YYYY-MM-DD')
          AND a.amount < 0
          AND a.trnstypeid IN (3,4)
          AND a.ulbid = :UlbId
      `;

      // filters
      if (params.majorCode && !params.minorCode) {
        query += ` AND a.glcode = :MajorCode`;
        bindParams.MajorCode = params.majorCode;
      }

      if (params.majorCode && params.minorCode) {
        query += ` AND acc.functioncode = :MajorCode AND acc.objectcode = :MinorCode`;
        bindParams.MajorCode = params.majorCode;
        bindParams.MinorCode = params.minorCode;
      }

      if (params.zoneId && params.zoneId !== "-1") {
        query += ` AND a.zoneid = :ZoneId`;
        bindParams.ZoneId = params.zoneId;
      }

      if (params.userId && params.userId !== "0") {
        query += ` AND a.insby = :UserId`;
        bindParams.UserId = params.userId;
      }

      if (params.budgetId && params.budgetId !== "-1") {
        query += ` AND a.budgetid = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.nidhiId && params.nidhiId !== "-1") {
        query += ` AND a.nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }

      query += `
        GROUP BY 
          a.trnsdate,
          a.glcode,
          acc.functioncode,
          acc.glname,
          a.accno,
          acc.objectcode,
          acc.accname,
          zoneename
          ${params.chkGramPanchayat ? ", var_grampanch_grampanch" : ""}
        ORDER BY a.trnsdate
      `;
    }

    // ================= SUMMARY (rptType != 1) =================
    else {
      query = `
        SELECT 
          NULL trnsdate,
          a.glcode,
          acc.glname,
          a.accno,
          UTL_RAW.CAST_TO_VARCHAR2(
            HEXTORAW(REPLACE(RAWTOHEX(acc.accname),'2808DE',''))
          ) accname,
          NULL deptname,
          NULL grampanch,
          SUM(a.amount) amount,
          acc.functioncode,
          acc.objectcode,
          0 BudgetCode
        FROM transview a
        INNER JOIN accountview_web acc 
          ON a.glcode = acc.glcode 
          AND a.accno = acc.accno 
          AND acc.ulbid = a.ulbid
        LEFT JOIN view_zone vz 
          ON vz.zoneid = a.zoneid
        LEFT JOIN aoac_grampanch_def 
          ON num_grampanch_grampanchid = a.grampanchid
        LEFT JOIN aoac_partymst_def 
          ON num_partymst_partyid = a.partycode
        WHERE 
          a.trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
          AND a.trnsdate <= TO_DATE(:ToDate,'YYYY-MM-DD')
          AND a.amount < 0
          AND a.trnstypeid IN (3,4)
          AND a.ulbid = :UlbId
      `;

      // filters same
      if (params.majorCode && !params.minorCode) {
        query += ` AND a.glcode = :MajorCode`;
        bindParams.MajorCode = params.majorCode;
      }

      if (params.majorCode && params.minorCode) {
        query += ` AND acc.functioncode = :MajorCode AND acc.objectcode = :MinorCode`;
        bindParams.MajorCode = params.majorCode;
        bindParams.MinorCode = params.minorCode;
      }

      if (params.zoneId && params.zoneId !== "-1") {
        query += ` AND a.zoneid = :ZoneId`;
        bindParams.ZoneId = params.zoneId;
      }

      if (params.userId && params.userId !== "0") {
        query += ` AND a.insby = :UserId`;
        bindParams.UserId = params.userId;
      }

      if (params.budgetId && params.budgetId !== "-1") {
        query += ` AND a.budgetid = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.nidhiId && params.nidhiId !== "-1") {
        query += ` AND a.nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }

      query += `
        GROUP BY 
          a.glcode,
          acc.functioncode,
          acc.glname,
          a.accno,
          acc.objectcode,
          acc.accname
        ORDER BY a.glcode, a.accno
      `;
    }

    return await executeQuery(query, bindParams);

  } catch (err) {
    throw err;
  }
};


async function getPaymentRegisterReport(params) {
  let bindParams = {
    fromDate: params.fromDate,
    toDate: params.toDate,
    ulbid: params.ulbid,
  };

  // ── PART 1 ──────────────────────────────────────────────
  let query = `
    SELECT 
        NULL AS VchRefNo,
        a.trnsdate,
        a.transno,
        TO_CHAR(a.docno) AS docno,
        a.glcode,
        acc.glname,
        a.accno,
        acc.accname,
        v.zoneename AS deptname,
        var_grampanch_grampanch AS grampanch,
        a.amount,
        a.narration,
        var_partymst_partyname AS partyname,
        0 AS BudgetCode,
        acc.functioncode,
        acc.objectcode
    FROM transview a
    INNER JOIN accountview_web acc  
        ON a.glcode = acc.glcode  
        AND a.accno = acc.accno 
        AND acc.ulbid = a.ulbid
    LEFT JOIN view_zone v 
        ON v.zoneid = a.zoneid
    LEFT JOIN aoac_grampanch_def 
        ON num_grampanch_grampanchid = a.grampanchid
    LEFT JOIN aoac_partymst_def 
        ON num_partymst_partyid = a.partycode
    WHERE 
        TRUNC(a.trnsdate) BETWEEN TO_DATE(:fromDate, 'DD-MM-YYYY') AND TO_DATE(:toDate, 'DD-MM-YYYY')
        AND a.amount < 0
        AND a.trnstypeid IN (3,4)
        AND a.sourceid <> 6
        AND a.ulbid = :ulbid
  `;

  if (params.glcode) {
    query += ` AND a.glcode = :glcode`;
    bindParams.glcode = params.glcode;
  }
  if (params.functioncode) {
    query += ` AND acc.functioncode = :functioncode`;
    bindParams.functioncode = params.functioncode;
  }
  if (params.objectcode) {
    query += ` AND acc.objectcode = :objectcode`;
    bindParams.objectcode = params.objectcode;
  }
  if (params.zoneid && params.zoneid !== "-1") {
    query += ` AND a.zoneid = :zoneid`;
    bindParams.zoneid = params.zoneid;
  }

  // ── PART 2 ──────────────────────────────────────────────
  query += `

    UNION ALL

    SELECT DISTINCT
        num_vchprepmst_refno AS VchRefNo,
        a.trnsdate,
        num_vchprepmst_trnsno AS transno,
        TO_CHAR(num_vchprepmst_vchno) AS docno,
        a.glcode,
        acc.glname,
        a.accno,
        acc.accname,
        v.zoneename AS deptname,
        var_grampanch_grampanch AS grampanch,
        num_vchprepmst_totalamt AS amount,
        var_vchpremst_narration AS narration,
        var_partymst_partyname AS partyname,
        0 AS BudgetCode,
        acc.functioncode,
        acc.objectcode
    FROM aoac_vchprepmst_def
    INNER JOIN transview a  
        ON num_vchprepmst_trnsno = a.transno 
        AND a.glcode = num_vchprepmst_drgl 
        AND a.accno = num_vchprepmst_dracc  
        AND a.amount = (num_vchprepmst_totalamt * -1)
    INNER JOIN accountview_web acc  
        ON a.glcode = acc.glcode  
        AND a.accno = acc.accno 
        AND acc.ulbid = a.ulbid
    LEFT JOIN view_zone v 
        ON v.zoneid = a.zoneid
    LEFT JOIN aoac_grampanch_def 
        ON num_grampanch_grampanchid = a.grampanchid
    LEFT JOIN aoac_partymst_def 
        ON num_partymst_partyid = num_vchprepmst_partyid
    WHERE 
        TRUNC(a.trnsdate) BETWEEN TO_DATE(:fromDate, 'DD-MM-YYYY') AND TO_DATE(:toDate, 'DD-MM-YYYY')
        AND a.amount < 0
        AND a.trnstypeid IN (3,4)
        AND a.ulbid = :ulbid
  `;

  // Same shared filters (reuse already-bound params — no re-assignment needed)
  if (params.glcode)        query += ` AND a.glcode = :glcode`;
  if (params.functioncode)  query += ` AND acc.functioncode = :functioncode`;
  if (params.objectcode)    query += ` AND acc.objectcode = :objectcode`;
  if (params.zoneid && params.zoneid !== "-1") query += ` AND a.zoneid = :zoneid`;

  // Part 2 exclusive filters
  if (params.grampanchid && params.grampanchid !== "-1") {
    query += ` AND a.grampanchid = :grampanchid`;
    bindParams.grampanchid = params.grampanchid;
  }
  if (params.budgetid && params.budgetid !== "-1") {
    query += ` AND a.budgetid = :budgetid`;
    bindParams.budgetid = params.budgetid;
  }
  if (params.nidhi_id && params.nidhi_id !== "-1") {
    query += ` AND a.nidhi_id = :nidhi_id`;
    bindParams.nidhi_id = params.nidhi_id;
  }

  query += `
    ORDER BY trnsdate, transno, docno
  `;

  return await executeQuery(query, bindParams);
}

module.exports = { getPaymentRegister,getPaymentRegisterReport };