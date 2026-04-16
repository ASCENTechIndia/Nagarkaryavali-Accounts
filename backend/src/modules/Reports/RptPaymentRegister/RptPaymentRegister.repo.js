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

module.exports = { getPaymentRegister };