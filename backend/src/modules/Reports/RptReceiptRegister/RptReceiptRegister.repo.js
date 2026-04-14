const { executeQuery } = require("../../../db/queryExecutor");

const getReceiptRegister = async (params) => {
  try {
    let query = "";
    let bindParams = {
      FromDate: params.fromDate,
      ToDate: params.toDate,
      UlbId: params.ulbId
    };

    // ================= DETAIL REPORT =================
    if (params.rptType === "1") {
      query = `
        SELECT 
          a.trnsdate,
          a.glcode,
          acc.glname,
          a.accno,
          acc.accname,
          vz.zoneename,
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
AND a.trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
          AND a.amount > 0
          AND (
            a.trnstypeid IN (1,2)
            OR (
              a.sourceid = 6 
              AND a.amount > 0 
              AND acc.accsubtypeid NOT IN (4810,4820,4821,4822,4823)
            )
          )
      `;

      // 🔹 Filters
      if (params.majorCode && !params.minorCode) {
        query += ` AND a.glcode = :MajorCode`;
        bindParams.MajorCode = params.majorCode;
      }

      if (params.majorCode && params.minorCode) {
        query += ` AND acc.functioncode = :MajorCode AND acc.objectcode = :MinorCode`;
        bindParams.MajorCode = params.majorCode;
        bindParams.MinorCode = params.minorCode;
      }

      if (params.zoneId) {
        query += ` AND a.zoneid = :ZoneId`;
        bindParams.ZoneId = params.zoneId;
      }

      if (params.grampanchayatId) {
        query += ` AND a.grampanchid = :GramId`;
        bindParams.GramId = params.grampanchayatId;
      }

      if (params.userId) {
        query += ` AND a.insby = :UserId`;
        bindParams.UserId = params.userId;
      }

      if (params.budgetId) {
        query += ` AND a.budgetid = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.nidhiId) {
        query += ` AND a.nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }

      query += `
        AND a.ulbid = :UlbId
        GROUP BY 
          a.trnsdate,
          a.glcode,
          acc.glname,
          acc.functioncode,
          a.accno,
          acc.objectcode,
          acc.accname,
          vz.zoneename
          ${params.chkGramPanchayat ? ", var_grampanch_grampanch" : ""}
        ORDER BY a.trnsdate
      `;
    }

    // ================= SUMMARY REPORT =================
    else {
      query = `
        SELECT 
          NULL trnsdate,
          a.glcode,
          acc.glname,
          a.accno,
          acc.accname,
          vz.zoneename,
          acc.functioncode,
          acc.objectcode,
          NULL grampanch,
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
AND a.trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
          AND a.amount > 0
          AND (
            a.trnstypeid IN (1,2)
            OR (
              a.sourceid = 6 
              AND a.amount > 0 
              AND acc.accsubtypeid NOT IN (4810,4820,4821,4822,4823)
            )
          )
      `;

      // 🔹 Same filters
      if (params.majorCode && !params.minorCode) {
        query += ` AND a.glcode = :MajorCode`;
        bindParams.MajorCode = params.majorCode;
      }

      if (params.majorCode && params.minorCode) {
        query += ` AND acc.functioncode = :MajorCode AND acc.objectcode = :MinorCode`;
        bindParams.MajorCode = params.majorCode;
        bindParams.MinorCode = params.minorCode;
      }

      if (params.zoneId) {
        query += ` AND a.zoneid = :ZoneId`;
        bindParams.ZoneId = params.zoneId;
      }

      if (params.grampanchayatId) {
        query += ` AND a.grampanchid = :GramId`;
        bindParams.GramId = params.grampanchayatId;
      }

      if (params.userId) {
        query += ` AND a.insby = :UserId`;
        bindParams.UserId = params.userId;
      }

      if (params.budgetId) {
        query += ` AND a.budgetid = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.nidhiId) {
        query += ` AND a.nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }

      query += `
        AND a.ulbid = :UlbId
        GROUP BY 
          a.glcode,
          acc.glname,
          acc.functioncode,
          a.accno,
          acc.objectcode,
          acc.accname,
          vz.zoneename
        ORDER BY a.glcode, a.accno
      `;
    }

    return await executeQuery(query, bindParams);   

  } catch (err) {
    throw err;
  }
};

module.exports = { getReceiptRegister };