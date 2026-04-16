const { executeQuery } = require("../../../db/queryExecutor");

const getTransferRegister = async (params) => {
  try {
    let query = `
      SELECT 
        a.trnsdate,
        a.transno,
        a.docno,
        a.glcode,
        acc.glname,
        a.accno,
        acc.accname,
        zoneename deptname,
        var_grampanch_grampanch grampanch,
        CASE WHEN a.amount > 0 THEN a.amount ELSE 0 END credit,
        CASE WHEN a.amount < 0 THEN a.amount * -1 ELSE 0 END debit,
        0 BudgetCode,
        acc.functioncode functioncode,
        acc.objectcode objectcode
      FROM transview a
      INNER JOIN accountview_web acc 
        ON a.glcode = acc.glcode 
        AND a.accno = acc.accno 
        AND acc.ulbid = a.ulbid
      INNER JOIN view_zone vz 
        ON vz.zoneid = a.zoneid
      LEFT JOIN aoac_grampanch_def 
        ON num_grampanch_grampanchid = a.grampanchid
      LEFT JOIN aoac_partymst_def 
        ON num_partymst_partyid = a.partycode
      WHERE 
        a.trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
        AND a.trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
    `;

    let bindParams = {
      FromDate: params.fromDate,
      ToDate: params.toDate,
      UlbId: params.ulbId
    };

    // ✅ Transaction Type
    if (params.trnsType && params.trnsType !== "0") {
      query += ` AND a.trnstypeid IN (${params.trnsType})`;
    }

    // ✅ Zone
    if (params.zoneId && params.zoneId !== "-1") {
      query += ` AND a.zoneid = :ZoneId`;
      bindParams.ZoneId = params.zoneId;
    }

    // ✅ Budget (only if MBMC)
    if (params.corpCode === "MBMC") {
      if (params.budgetId && params.budgetId !== "-1") {
        query += ` AND a.budgetid = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.nidhiId && params.nidhiId !== "-1") {
        query += ` AND a.nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }
    }

    // ✅ ULB (mandatory)
    query += ` AND a.ulbid = :UlbId`;

    // ✅ Order
    query += `
      ORDER BY 
        a.trnsdate,
        a.transno,
        a.amount DESC
    `;

    return await executeQuery(query, bindParams);

  } catch (err) {
    throw err;
  }
};

module.exports = { getTransferRegister };