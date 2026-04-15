const { executeQuery } = require("../../../db/queryExecutor");

async function getTransTypeRepo() {
  console.log("📤 Repo: Fetch Transfer Register");

  const sql = `
    SELECT 
      var_trnstype_trnstype AS trnstype,
      num_trnstype_trnstypeid AS trnstypeid
    FROM aoac_trnstype_def
    WHERE num_trnstype_trnstypeid IN (5, 8, 9)
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getTransactionRegisterReportRepo(payload) {
  console.log("📤 Repo: Fetch Transaction Register Report", payload);

  const { fromDate, toDate, trnstypeid, zoneId, ulbId } = payload;

  const sql = `
    SELECT 
        a.trnsdate,
        a.transno,
        a.docno,
        a.glcode,
        acc.glname,
        a.accno,
        acc.accname,
        
        a.trnstypeid,
        a.nidhi_id,
        a.budgetid,
        a.grampanchid, 
        a.zoneid, 
        a.ulbid,
        
        vz.zoneename AS deptname,
        var_grampanch_grampanch AS grampanch,
        
        CASE WHEN a.amount > 0 THEN a.amount ELSE 0 END AS credit,
        CASE WHEN a.amount < 0 THEN a.amount * -1 ELSE 0 END AS debit,
        
        0 AS BudgetCode,
        acc.functioncode,
        acc.objectcode

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

    WHERE a.trnsdate >= TO_DATE(:fromDate, 'YYYY-MM-DD')
    AND a.trnsdate < TO_DATE(:toDate, 'YYYY-MM-DD')

    AND a.trnstypeid IN (${trnstypeid.map((_, i) => `:t${i}`).join(",")})
    AND a.zoneid = :zoneId
    AND a.ulbid = :ulbId

    ORDER BY a.trnsdate, a.transno, a.amount DESC
  `;

  const binds = { fromDate, toDate, zoneId, ulbId };

  trnstypeid.forEach((val, i) => {
    binds[`t${i}`] = val;
  });

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


module.exports = {
  getTransTypeRepo,
  getTransactionRegisterReportRepo,
};