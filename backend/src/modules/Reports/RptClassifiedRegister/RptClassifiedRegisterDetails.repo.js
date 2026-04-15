const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");



async function getNidhiConfig(budgetId, ulbId) {
  // We use named binds (:budgetId, :ulbId) to follow the oracledb pattern
  const sql = `
    SELECT 
      nidhiname, 
      nidhiid 
    FROM vw_nidhi_config
    WHERE budgetid = :budgetId 
      AND nidhiflag = 'Y' 
      AND ulbid = :ulbId
    ORDER BY nidhiname
  `;

  // Bind parameters to the query
  const params = { 
    budgetId: budgetId, 
    ulbId: ulbId 
  };

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


async function getMonthlySummaryReport(filters) {
  const isReceipt = filters.rptType === "0";

  // ✅ FIXED
  const amountFactor = isReceipt ? "a.amount" : "a.amount * -1";

  // ❌ OLD (WRONG)
  // "(1, 2) OR (...)"

  // ✅ FIXED (VALID SQL)
  const trnsTypes = isReceipt
    ? "(a.trnstypeid IN (1, 2) OR (a.trnstypeid = 4 AND a.amount > 0))"
    : "a.trnstypeid IN (3, 4)";

  const amountCondition = isReceipt ? "a.amount > 0" : "a.amount < 0";

  let params = {
    ulbId: filters.ulbId,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    preDate: filters.preDate,
    accFromDate: filters.accFromDate,
  };

  // ✅ Day columns
  let dayColumns = "";
  for (let i = 1; i <= 31; i++) {
    dayColumns += `
      CASE 
        WHEN EXTRACT(DAY FROM a.trnsdate) = ${i} 
        THEN ${amountFactor} 
        ELSE 0 
      END AS D${i}${i < 31 ? "," : ""}
    `;
  }

  let sql = `
    SELECT 
      glcode, glname, accno, accname, budgamout, budgprov, functioncode, objectcode,
      ${Array.from({ length: 31 }, (_, i) => `NVL(SUM(D${i + 1}), 0) AS D${i + 1}`).join(", ")},
      NVL(SUM(PrevAmt), 0) AS PrevAmt,
      BudgetSrNo
    FROM (
      SELECT 
        a.glcode,
        acc.glname,
        a.accno,
        acc.accname,
        NVL(acc.budgetamt, 0) AS budgamout,
        NVL(${isReceipt ? "map.num_budgetaccmap_revisedamt" : "acc.revbudgetamt"}, 0) AS budgprov,
        acc.functioncode,
        acc.objectcode,
        map.num_budgetaccmap_subgroup AS BudgetSubGroup,
        NVL(map.num_budgetaccmap_srno, 0) AS BudgetSrNo,

        ${dayColumns},

        (
          SELECT NVL(SUM(${amountFactor}), 0)
          FROM transview b
          WHERE b.trnsdate <= TO_DATE(:preDate, 'DD-MON-YYYY')
            AND b.trnsdate >= TO_DATE(:accFromDate, 'DD-MON-YYYY')
            AND b.glcode = a.glcode
            AND b.accno = a.accno
            AND ${isReceipt ? "b.amount > 0" : "b.amount < 0"}
            AND ${
              isReceipt
                ? "b.trnstypeid IN (1,2) OR (b.trnstypeid = 4 AND b.amount > 0)"
                : "b.trnstypeid IN (3,4)"
            }
        ) AS PrevAmt

      FROM transview a
      INNER JOIN accountview_web acc
        ON acc.glcode = a.glcode
       AND acc.accno = a.accno
       AND acc.ulbid = a.ulbid

      LEFT JOIN aoac_budgetaccmap_det map
        ON map.num_budgetaccmap_glcode = a.glcode
       AND map.num_budgetaccmap_accountno = a.accno
       AND map.num_budgetaccmap_ulbid = a.ulbid

      WHERE a.trnsdate >= TO_DATE(:fromDate, 'DD-MON-YYYY')
        AND a.trnsdate <= TO_DATE(:toDate, 'DD-MON-YYYY')
        AND a.ulbid = :ulbId
        AND ${trnsTypes}
        AND ${amountCondition}
  `;

  // ✅ Dynamic Filters (SAFE)
  if (filters.corpCode === "MBMC") {
    if (filters.budgetId && filters.budgetId !== "-1") {
      sql += " AND a.budgetid = :budgetId ";
      params.budgetId = filters.budgetId;
    }

    if (filters.nidhiId && filters.nidhiId !== "-1") {
      sql += " AND a.nidhi_id = :nidhiId ";
      params.nidhiId = filters.nidhiId;
    }
  }

  if (filters.zoneId && filters.zoneId !== "-1") {
    sql += " AND a.zoneid = :zoneId ";
    params.zoneId = filters.zoneId;
  }

  if (filters.corpCode === "DMC") {
    sql += " AND a.trnstypeid <> 9 ";
  }

  // ✅ Final filters
  sql += `
        AND acc.accsubtypeid NOT IN (1, 2)
        AND a.accno NOT IN ('4148100001', '4148210004')
        AND acc.accsubtypeid NOT IN (4820, 4821${isReceipt ? ", 2110, 2272" : ""})
    )
    GROUP BY 
      glcode, glname, accno, accname,
      budgamout, budgprov,
      BudgetSubGroup, BudgetSrNo,
      functioncode, objectcode
    ORDER BY 
      BudgetSubGroup,
      BudgetSrNo,
      glcode,
      accno
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}
// Don't forget to add it to your module.exports
module.exports = {

  getNidhiConfig, 
  getMonthlySummaryReport,
};