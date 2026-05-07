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

async function getMonthlyBudgetReport(filters) {

  let params = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    prevFromDate: filters.prevFromDate,
    prevToDate: filters.prevToDate,
    ulbId: filters.ulbId
  };

  let sql = `
SELECT 
    glcode,
    glname,
    accno,
    accname,
    budgamout,
    budgprov,
    functioncode,
    objectcode,
    BudgetSrNo,

    D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,
    D11,D12,D13,D14,D15,D16,D17,D18,D19,D20,
    D21,D22,D23,D24,D25,D26,D27,D28,D29,D30,D31,

    PrevAmt,

    (
      D1+D2+D3+D4+D5+D6+D7+D8+D9+D10+
      D11+D12+D13+D14+D15+D16+D17+D18+D19+D20+
      D21+D22+D23+D24+D25+D26+D27+D28+D29+D30+D31
    ) AS Total_For_Month,

    (
      (
        D1+D2+D3+D4+D5+D6+D7+D8+D9+D10+
        D11+D12+D13+D14+D15+D16+D17+D18+D19+D20+
        D21+D22+D23+D24+D25+D26+D27+D28+D29+D30+D31
      ) + PrevAmt
    ) AS Progressive_Total,

    (
      budgamout -
      (
        (
          D1+D2+D3+D4+D5+D6+D7+D8+D9+D10+
          D11+D12+D13+D14+D15+D16+D17+D18+D19+D20+
          D21+D22+D23+D24+D25+D26+D27+D28+D29+D30+D31
        ) + PrevAmt
      )
    ) AS Budget_Balance

FROM (
    SELECT 
        glcode,
        glname,
        accno,
        accname,
        budgamout,
        budgprov,
        functioncode,
        objectcode,
        BudgetSrNo,

        NVL(SUM(D1),0) D1,
        NVL(SUM(D2),0) D2,
        NVL(SUM(D3),0) D3,
        NVL(SUM(D4),0) D4,
        NVL(SUM(D5),0) D5,
        NVL(SUM(D6),0) D6,
        NVL(SUM(D7),0) D7,
        NVL(SUM(D8),0) D8,
        NVL(SUM(D9),0) D9,
        NVL(SUM(D10),0) D10,
        NVL(SUM(D11),0) D11,
        NVL(SUM(D12),0) D12,
        NVL(SUM(D13),0) D13,
        NVL(SUM(D14),0) D14,
        NVL(SUM(D15),0) D15,
        NVL(SUM(D16),0) D16,
        NVL(SUM(D17),0) D17,
        NVL(SUM(D18),0) D18,
        NVL(SUM(D19),0) D19,
        NVL(SUM(D20),0) D20,
        NVL(SUM(D21),0) D21,
        NVL(SUM(D22),0) D22,
        NVL(SUM(D23),0) D23,
        NVL(SUM(D24),0) D24,
        NVL(SUM(D25),0) D25,
        NVL(SUM(D26),0) D26,
        NVL(SUM(D27),0) D27,
        NVL(SUM(D28),0) D28,
        NVL(SUM(D29),0) D29,
        NVL(SUM(D30),0) D30,
        NVL(SUM(D31),0) D31,

        NVL(SUM(PrevAmt),0) PrevAmt

    FROM (
        SELECT 
            a.glcode,
            acc.glname,
            a.accno,
            acc.accname,

            NVL(acc.budgetamt,0) budgamout,
            NVL(num_budgetaccmap_revisedamt,0) budgprov,

            acc.functioncode,
            acc.objectcode,

            NVL(num_budgetaccmap_srno,0) BudgetSrNo,

            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=1 THEN a.amount ELSE 0 END D1,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=2 THEN a.amount ELSE 0 END D2,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=3 THEN a.amount ELSE 0 END D3,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=4 THEN a.amount ELSE 0 END D4,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=5 THEN a.amount ELSE 0 END D5,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=6 THEN a.amount ELSE 0 END D6,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=7 THEN a.amount ELSE 0 END D7,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=8 THEN a.amount ELSE 0 END D8,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=9 THEN a.amount ELSE 0 END D9,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=10 THEN a.amount ELSE 0 END D10,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=11 THEN a.amount ELSE 0 END D11,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=12 THEN a.amount ELSE 0 END D12,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=13 THEN a.amount ELSE 0 END D13,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=14 THEN a.amount ELSE 0 END D14,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=15 THEN a.amount ELSE 0 END D15,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=16 THEN a.amount ELSE 0 END D16,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=17 THEN a.amount ELSE 0 END D17,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=18 THEN a.amount ELSE 0 END D18,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=19 THEN a.amount ELSE 0 END D19,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=20 THEN a.amount ELSE 0 END D20,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=21 THEN a.amount ELSE 0 END D21,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=22 THEN a.amount ELSE 0 END D22,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=23 THEN a.amount ELSE 0 END D23,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=24 THEN a.amount ELSE 0 END D24,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=25 THEN a.amount ELSE 0 END D25,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=26 THEN a.amount ELSE 0 END D26,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=27 THEN a.amount ELSE 0 END D27,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=28 THEN a.amount ELSE 0 END D28,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=29 THEN a.amount ELSE 0 END D29,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=30 THEN a.amount ELSE 0 END D30,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=31 THEN a.amount ELSE 0 END D31,

            (
              SELECT SUM(b.amount)
              FROM transview b
              WHERE b.trnsdate <= TO_DATE(:prevToDate,'DD-MON-YYYY')
              AND b.trnsdate >= TO_DATE(:prevFromDate,'DD-MON-YYYY')
              AND b.amount > 0
              AND b.glcode = a.glcode
              AND b.accno = a.accno
            ) AS PrevAmt

        FROM transview a

        INNER JOIN accountview_web acc
          ON acc.glcode = a.glcode
         AND acc.accno = a.accno
         AND acc.ulbid = a.ulbid

        LEFT JOIN aoac_budgetaccmap_det
          ON num_budgetaccmap_glcode = a.glcode
         AND num_budgetaccmap_accountno = a.accno
         AND num_budgetaccmap_ulbid = a.ulbid

        WHERE a.trnsdate >= TO_DATE(:fromDate,'DD-MON-YYYY')
          AND a.trnsdate <= TO_DATE(:toDate,'DD-MON-YYYY')

          AND (
            a.trnstypeid IN (1,2)
            OR (a.trnstypeid = 4 AND a.amount > 0)
          )

          AND acc.accsubtypeid NOT IN (1,2)
          AND a.ulbid = :ulbId
          AND a.accno NOT IN ('4148100001','4148210004')
          AND acc.accsubtypeid NOT IN (4820,4821,2110,2272)
  `;

  // 🔹 Optional Zone Filter
  if (filters.zoneId && filters.zoneId !== "-1") {
    sql += ` AND a.zoneid = :zoneId `;
    params.zoneId = filters.zoneId;
  }

  sql += `
    )
    GROUP BY
      glcode,
      glname,
      accno,
      accname,
      budgamout,
      budgprov,
      functioncode,
      objectcode,
      BudgetSrNo
)
ORDER BY BudgetSrNo
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}
async function getMonthlyExpenditureBudgetReport(filters) {

  let params = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    prevFromDate: filters.prevFromDate,
    prevToDate: filters.prevToDate,
    ulbId: filters.ulbId
  };

  let sql = `
SELECT 
    glcode,
    glname,
    accno,
    accname,
    budgamout,
    budgprov,
    functioncode,
    objectcode,
    BudgetSrNo,

    D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,
    D11,D12,D13,D14,D15,D16,D17,D18,D19,D20,
    D21,D22,D23,D24,D25,D26,D27,D28,D29,D30,D31,

    PrevAmt,

    (
      D1+D2+D3+D4+D5+D6+D7+D8+D9+D10+
      D11+D12+D13+D14+D15+D16+D17+D18+D19+D20+
      D21+D22+D23+D24+D25+D26+D27+D28+D29+D30+D31
    ) AS Total_For_Month,

    (
      (
        D1+D2+D3+D4+D5+D6+D7+D8+D9+D10+
        D11+D12+D13+D14+D15+D16+D17+D18+D19+D20+
        D21+D22+D23+D24+D25+D26+D27+D28+D29+D30+D31
      ) + PrevAmt
    ) AS Progressive_Total,

    (
      budgamout -
      (
        (
          D1+D2+D3+D4+D5+D6+D7+D8+D9+D10+
          D11+D12+D13+D14+D15+D16+D17+D18+D19+D20+
          D21+D22+D23+D24+D25+D26+D27+D28+D29+D30+D31
        ) + PrevAmt
      )
    ) AS Budget_Balance

FROM (
    SELECT 
        glcode,
        glname,
        accno,
        accname,
        budgamout,
        budgprov,
        functioncode,
        objectcode,
        BudgetSrNo,

        NVL(SUM(D1),0) D1,
        NVL(SUM(D2),0) D2,
        NVL(SUM(D3),0) D3,
        NVL(SUM(D4),0) D4,
        NVL(SUM(D5),0) D5,
        NVL(SUM(D6),0) D6,
        NVL(SUM(D7),0) D7,
        NVL(SUM(D8),0) D8,
        NVL(SUM(D9),0) D9,
        NVL(SUM(D10),0) D10,
        NVL(SUM(D11),0) D11,
        NVL(SUM(D12),0) D12,
        NVL(SUM(D13),0) D13,
        NVL(SUM(D14),0) D14,
        NVL(SUM(D15),0) D15,
        NVL(SUM(D16),0) D16,
        NVL(SUM(D17),0) D17,
        NVL(SUM(D18),0) D18,
        NVL(SUM(D19),0) D19,
        NVL(SUM(D20),0) D20,
        NVL(SUM(D21),0) D21,
        NVL(SUM(D22),0) D22,
        NVL(SUM(D23),0) D23,
        NVL(SUM(D24),0) D24,
        NVL(SUM(D25),0) D25,
        NVL(SUM(D26),0) D26,
        NVL(SUM(D27),0) D27,
        NVL(SUM(D28),0) D28,
        NVL(SUM(D29),0) D29,
        NVL(SUM(D30),0) D30,
        NVL(SUM(D31),0) D31,

        NVL(SUM(PrevAmt),0) PrevAmt

    FROM (
        SELECT 
            a.glcode,
            acc.glname,
            a.accno,
            acc.accname,

            NVL(budgetamt,0) budgamout,
            NVL(revbudgetamt,0) budgprov,

            acc.functioncode,
            acc.objectcode,

            NVL(num_budgetaccmap_srno,0) BudgetSrNo,

            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=1 THEN a.amount*-1 ELSE 0 END D1,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=2 THEN a.amount*-1 ELSE 0 END D2,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=3 THEN a.amount*-1 ELSE 0 END D3,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=4 THEN a.amount*-1 ELSE 0 END D4,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=5 THEN a.amount*-1 ELSE 0 END D5,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=6 THEN a.amount*-1 ELSE 0 END D6,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=7 THEN a.amount*-1 ELSE 0 END D7,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=8 THEN a.amount*-1 ELSE 0 END D8,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=9 THEN a.amount*-1 ELSE 0 END D9,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=10 THEN a.amount*-1 ELSE 0 END D10,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=11 THEN a.amount*-1 ELSE 0 END D11,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=12 THEN a.amount*-1 ELSE 0 END D12,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=13 THEN a.amount*-1 ELSE 0 END D13,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=14 THEN a.amount*-1 ELSE 0 END D14,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=15 THEN a.amount*-1 ELSE 0 END D15,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=16 THEN a.amount*-1 ELSE 0 END D16,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=17 THEN a.amount*-1 ELSE 0 END D17,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=18 THEN a.amount*-1 ELSE 0 END D18,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=19 THEN a.amount*-1 ELSE 0 END D19,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=20 THEN a.amount*-1 ELSE 0 END D20,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=21 THEN a.amount*-1 ELSE 0 END D21,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=22 THEN a.amount*-1 ELSE 0 END D22,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=23 THEN a.amount*-1 ELSE 0 END D23,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=24 THEN a.amount*-1 ELSE 0 END D24,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=25 THEN a.amount*-1 ELSE 0 END D25,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=26 THEN a.amount*-1 ELSE 0 END D26,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=27 THEN a.amount*-1 ELSE 0 END D27,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=28 THEN a.amount*-1 ELSE 0 END D28,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=29 THEN a.amount*-1 ELSE 0 END D29,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=30 THEN a.amount*-1 ELSE 0 END D30,
            CASE WHEN EXTRACT(DAY FROM a.trnsdate)=31 THEN a.amount*-1 ELSE 0 END D31,

            (
              SELECT SUM(b.amount*-1)
              FROM transview b
              WHERE b.trnsdate <= TO_DATE(:prevToDate,'DD-MON-YYYY')
              AND b.trnsdate >= TO_DATE(:prevFromDate,'DD-MON-YYYY')
              AND b.amount < 0
              AND b.trnstypeid IN (3,4)
              AND b.glcode = a.glcode
              AND b.accno = a.accno
            ) AS PrevAmt

        FROM transview a

        INNER JOIN accountview_web acc
          ON acc.glcode = a.glcode
         AND acc.accno = a.accno
         AND acc.ulbid = a.ulbid

        LEFT JOIN aoac_budgetaccmap_det
          ON num_budgetaccmap_glcode = a.glcode
         AND num_budgetaccmap_accountno = a.accno
         AND num_budgetaccmap_ulbid = a.ulbid

        WHERE a.trnsdate >= TO_DATE(:fromDate,'DD-MON-YYYY')
          AND a.trnsdate <= TO_DATE(:toDate,'DD-MON-YYYY')

          AND a.trnstypeid IN (3,4)
          AND a.amount < 0

          AND acc.accsubtypeid NOT IN (1,2)
          AND a.ulbid = :ulbId

          AND a.accno NOT IN ('4148100001','4148210004')
          AND acc.accsubtypeid NOT IN (4820,4821)
  `;

  // 🔹 Optional Zone Filter
  if (filters.zoneId && filters.zoneId !== "-1") {
    sql += ` AND a.zoneid = :zoneId `;
    params.zoneId = filters.zoneId;
  }

  sql += `
    )
    GROUP BY
      glcode,
      glname,
      accno,
      accname,
      budgamout,
      budgprov,
      functioncode,
      objectcode,
      BudgetSrNo
)
ORDER BY BudgetSrNo
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

module.exports = {

  getNidhiConfig, 
  getMonthlySummaryReport,
  getMonthlyBudgetReport,
  getMonthlyExpenditureBudgetReport
};