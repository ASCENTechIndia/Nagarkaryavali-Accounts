const { executeQuery } = require("../../../db/queryExecutor");

const getPaymentRegister = async (params) => {
  try {
    let query = "";
    let bindParams = {
      FromDate: params.fromDate,
      ToDate: params.toDate,
      UlbId: params.ulbId,
    };

    // ================= DETAIL (rptType = 1) =================
    if (params.rptType === "1") {
      console.log("Tapshil");
      query = `
SELECT *
FROM (
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

    UNION ALL

    SELECT
        TRUNC(a.date_receiptmst_trnsdate) trnsdate,
        
        num_receiptdesc_glcode glcode,
        acc.glname,
        num_receiptdesc_accno accno,
        UTL_RAW.CAST_TO_VARCHAR2(
            HEXTORAW(REPLACE(RAWTOHEX(acc.accname),'2808DE',''))
        ) accname,
        zoneename deptname,
        acc.functioncode,
        acc.objectcode,
        ${params.chkGramPanchayat ? "var_grampanch_grampanch" : "NULL"} AS grampanch,
        -1 * SUM(num_receiptdesc_amount) amount,
        0 BudgetCode
    FROM aoac_receiptmst_def a
    INNER JOIN aoac_receiptdesc_def d
        ON a.num_receiptmst_refno = d.num_receiptdesc_refno
    INNER JOIN accountview_web acc
        ON d.num_receiptdesc_glcode = acc.glcode
        AND d.num_receiptdesc_accno = acc.accno
        AND acc.ulbid = a.num_receiptmst_ulbid
    LEFT JOIN view_zone vz
        ON vz.zoneid = a.num_receiptmst_zoneid
    LEFT JOIN aoac_grampanch_def
        ON num_grampanch_grampanchid = a.num_receiptmst_grampanchid
    WHERE
        a.date_receiptmst_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
        AND a.date_receiptmst_trnsdate <= TO_DATE(:ToDate,'YYYY-MM-DD')
        AND num_receiptdesc_amount > 0
        AND a.num_receiptmst_ulbid = :UlbId
        AND  a.num_receiptmst_trnsno IS NOT NULL
`;

      if (params.zoneId && params.zoneId !== "-1") {
        query += ` AND a.num_receiptmst_zoneid = :ZoneId`;
      }

      if (params.budgetId && params.budgetId !== "-1") {
        query += ` AND a.num_receiptmst_budget_id = :BudgetId`;
      }

      if (params.nidhiId && params.nidhiId !== "-1") {
        query += ` AND a.num_receiptmst_nidhi_id = :NidhiId`;
      }

      query += `
    GROUP BY
        a.date_receiptmst_trnsdate, 
       
        d.num_receiptdesc_glcode,
        acc.functioncode,
        acc.glname,
        d.num_receiptdesc_accno,
        acc.objectcode,
        acc.accname,
        zoneename
        ${params.chkGramPanchayat ? ", var_grampanch_grampanch" : ""}
)

ORDER BY trnsdate
`;
    }

    // ================= SUMMARY (rptType != 1) =================
    else {
      console.log("Saransh");
      query = `
SELECT *
FROM (
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
    left outer join view_zone vz ON vz.zoneid =a.zoneid  
left outer join aoac_grampanch_def on num_grampanch_grampanchid = a.grampanchid 
left outer join aoac_partymst_def on num_partymst_partyid = a.partycode 
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

    UNION ALL

    SELECT
        NULL trnsdate,
        
        d.num_receiptdesc_glcode glcode,
        acc.glname,
        d.num_receiptdesc_accno accno,
        UTL_RAW.CAST_TO_VARCHAR2(
            HEXTORAW(REPLACE(RAWTOHEX(acc.accname),'2808DE',''))
        ) accname,
        NULL deptname,
        NULL grampanch,
        -1 * SUM(d.num_receiptdesc_amount) amount,
        acc.functioncode,
        acc.objectcode,
        0 BudgetCode
    FROM aoac_receiptmst_def a
    INNER JOIN aoac_receiptdesc_def d
        ON a.num_receiptmst_refno = d.num_receiptdesc_refno
    INNER JOIN accountview_web acc
        ON d.num_receiptdesc_glcode = acc.glcode
        AND d.num_receiptdesc_accno = acc.accno
        AND acc.ulbid = a.num_receiptmst_ulbid
    left outer join view_zone vz ON vz.zoneid =a.num_receiptmst_zoneid  
left outer join aoac_grampanch_def on num_grampanch_grampanchid = a.num_receiptmst_grampanchid 
    WHERE
        a.date_receiptmst_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
        AND a.date_receiptmst_trnsdate <= TO_DATE(:ToDate,'YYYY-MM-DD')
        AND d.num_receiptdesc_amount > 0
        AND a.num_receiptmst_ulbid = :UlbId
        AND a.num_receiptmst_trnsno is not null
`;

      query += `
    GROUP BY
        
        d.num_receiptdesc_glcode,
        acc.functioncode,
        acc.glname,
        d.num_receiptdesc_accno,
        acc.objectcode,
        acc.accname
)
        
ORDER BY glcode, accno
`;
    }
    console.log("query", query)
    return await executeQuery(query, bindParams);
  } catch (err) {
    throw err;
  }
};


const getPaymentRegisterReport = async (params) => {
  let bindParams = {
    fromDate: params.fromDate,
    toDate: params.toDate,
    ulbid: params.ulbid,
  };

  let query = `
    SELECT
        NULL VchRefNo,
        a.trnsdate,
        a.transno,
        TO_CHAR(a.docno) docno,
        a.glcode,
        acc.glname,
        a.accno,
        acc.accname,
        v.zoneename deptname,
        var_grampanch_grampanch grampanch,
        a.amount,
        narration,
        var_partymst_partyname partyname,
        0 BudgetCode,
        acc.functioncode functioncode,
        acc.objectcode objectcode
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
    WHERE TRUNC(a.trnsdate)
          BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
              AND TO_DATE(:toDate,'DD-MM-YYYY')
      AND a.amount < 0
      AND a.trnstypeid IN (3,4)
      AND sourceid <> 6
      AND a.ulbid = :ulbid
  `;

  // Common Filters - Part 1
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

  // ================= RECEIPT PART =================

  query += `
    UNION ALL

    SELECT
        NULL VchRefNo,
        a.date_receiptmst_trnsdate trnsdate,
        a.num_receiptmst_trnsno transno,
        TO_CHAR(a.num_receiptmst_refno) docno,
        num_receiptdesc_glcode glcode,
        acc.glname,
        num_receiptdesc_accno accno,
        acc.accname,
        v.zoneename deptname,
        var_grampanch_grampanch grampanch,
        -1 * num_receiptdesc_amount amount,
        var_receiptdesc_narration narration,
        '' partyname,
        0 BudgetCode,
        acc.functioncode functioncode,
        acc.objectcode objectcode
    FROM aoac_receiptmst_def a
    INNER JOIN aoac_receiptdesc_def d
      ON a.num_receiptmst_refno = d.num_receiptdesc_refno
    INNER JOIN accountview_web acc
      ON d.num_receiptdesc_glcode = acc.glcode
     AND d.num_receiptdesc_accno = acc.accno
     AND acc.ulbid = a.num_receiptmst_ulbid
    LEFT JOIN view_zone v
      ON v.zoneid = a.num_receiptmst_zoneid
    LEFT JOIN aoac_grampanch_def
      ON num_grampanch_grampanchid = a.num_receiptmst_grampanchid
    WHERE a.num_receiptmst_trnsno IS NOT NULL
      AND TRUNC(a.date_receiptmst_trnsdate)
          BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
              AND TO_DATE(:toDate,'DD-MM-YYYY')
      AND d.num_receiptdesc_amount > 0
      AND a.num_receiptmst_ulbid = :ulbid
  `;

  if (params.glcode) {
    query += ` AND d.num_receiptdesc_glcode = :glcode`;
  }

  if (params.functioncode) {
    query += ` AND acc.functioncode = :functioncode`;
  }

  if (params.objectcode) {
    query += ` AND acc.objectcode = :objectcode`;
  }

  if (params.zoneid && params.zoneid !== "-1") {
    query += ` AND a.num_receiptmst_zoneid = :zoneid`;
  }

  // ================= VOUCHER PART =================

  query += `
    UNION ALL

    SELECT DISTINCT
        num_vchprepmst_refno VchRefNo,
        a.trnsdate,
        num_vchprepmst_trnsno transno,
        TO_CHAR(num_vchprepmst_vchno) docno,
        a.glcode,
        acc.glname,
        a.accno,
        acc.accname,
        v.zoneename deptname,
        var_grampanch_grampanch grampanch,
        num_vchprepmst_totalamt,
        var_vchpremst_narration,
        var_partymst_partyname partyname,
        0 BudgetCode,
        acc.functioncode functioncode,
        acc.objectcode objectcode
    FROM aoac_vchprepmst_def
    INNER JOIN transview a
      ON num_vchprepmst_trnsno = transno
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
    WHERE TRUNC(a.trnsdate)
          BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
              AND TO_DATE(:toDate,'DD-MM-YYYY')
      AND a.amount < 0
      AND a.trnstypeid IN (3,4)
      AND a.ulbid = :ulbid
  `;

  // Common Filters - Part 3
  if (params.glcode) {
    query += ` AND a.glcode = :glcode`;
  }

  if (params.functioncode) {
    query += ` AND acc.functioncode = :functioncode`;
  }

  if (params.objectcode) {
    query += ` AND acc.objectcode = :objectcode`;
  }

  if (params.zoneid && params.zoneid !== "-1") {
    query += ` AND a.zoneid = :zoneid`;
  }

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
};

module.exports = { getPaymentRegister, getPaymentRegisterReport };
