const { executeQuery } = require("../../../db/queryExecutor");
const { AppError } = require("../../../libs/errors");

async function getConsolidateChallanData({ fromDate, toDate, ulbId }) {
  console.log("Repo → Consolidate Challan Payload:", {
    fromDate,
    toDate,
    ulbId
  });

  const sql = `
    SELECT
      trnsdate,
      userid,
      glcode,
      glname,
      accno,
      accname,
      zoneename,
      functioncode,
      objectcode,
      grampanch,
      SUM(amount) AS amount,
      BudgetCode,
      SUM(discountamount) AS discountamount,
      deptname,
      dept_marname
    FROM VW_ALLCHALLAN_REPORT
    WHERE trnsdate >= TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND trnsdate <  TO_DATE(:toDate, 'YYYY-MM-DD') + 1
      AND ulbid = :ulbId
    GROUP BY
      trnsdate,
      userid,
      glcode,
      glname,
      accno,
      accname,
      zoneename,
      functioncode,
      objectcode,
      grampanch,
      BudgetCode,
      deptname,
      dept_marname
    ORDER BY
      trnsdate,
      userid,
      glcode,
      accno
  `;

  const binds = {
    fromDate,
    toDate,
    ulbId: Number(ulbId)
  };

  console.log("Final SQL:", sql);
  console.log("Binds:", binds);

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new AppError(result.error, 500);
  }

  return result.rows || [];
}

module.exports = {
  getConsolidateChallanData,
};