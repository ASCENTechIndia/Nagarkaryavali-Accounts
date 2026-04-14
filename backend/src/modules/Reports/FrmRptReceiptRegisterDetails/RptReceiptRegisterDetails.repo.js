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
    SELECT a.trnsdate, a.transno, a.docno, a.glcode, acc.glname, a.accno, acc.accname, 
           vz.zoneename, agd.var_grampanch_grampanch AS grampanch, a.amount, 
           a.narration, apd.var_partymst_partyname AS partyname, 
           0 AS BudgetCode, acc.functioncode, acc.objectcode, a.nidhi_id
    FROM transview a
    INNER JOIN accountview_web acc ON a.glcode = acc.glcode AND a.accno = acc.accno AND acc.ulbid = a.ulbid
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
module.exports = {

  getTransactionReport, 
  getNidhiConfig,
};