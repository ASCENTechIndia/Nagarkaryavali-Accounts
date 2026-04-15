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

module.exports = {
  getGrampanchayatListRepo,
  getCashBankBalanceReportRepo
};