const { executeQuery } = require("../../db/queryExecutor");

const BindPayModeGrid = async (corpId) => {
  let query = "";
  let params = {};

  if (corpId === "890" || corpId === "1710") {
    query = `SELECT * FROM vw_dsbdtls_MBMC`;
  } else {
    query = `SELECT * FROM view_balances WHERE ulbid = :corpId`;
    params = { corpId };
  }

  const result = await executeQuery(query, params);
  console.log("QUERY RESULT:", result);

  if (!result || result.success === false) return [];

  return result.rows || result || [];
};

const BindReceiptGrid = async (corpId) => {
  const query = `
    SELECT 
      ulbid,
      var_budgetconfig_budgetname,
      ROUND(SUM(num_budgetaccmap_budgetprov)/10000000,2) AS provision,
      NVL(ROUND(SUM(amount)/10000000,2),0) AS utilisation,
      NVL(
        ROUND(
          SUM(amount)/10000000 /
          NULLIF(SUM(num_budgetaccmap_budgetprov)/10000000,0) * 100
        ,2),0
      ) AS percentage
    FROM (
      SELECT 
        num_budgetaccmap_ulbid ulbid,
        l1.var_budgetconfig_budgetname,
        num_budgetaccmap_glcode,
        num_budgetaccmap_accountno,
        num_budgetaccmap_budgetprov,
        num_budgetaccmap_revisedamt,
        CASE WHEN amount > 0 THEN amount ELSE -amount END AS amount
      FROM aoac_budgetconfig_det l1
      INNER JOIN aoac_budgetconfig_det l2 
        ON l1.num_budgetconfig_headid = l2.num_budgetconfig_parentid
      INNER JOIN aoac_budgetconfig_det l3 
        ON l2.num_budgetconfig_headid = l3.num_budgetconfig_parentid
      INNER JOIN aoac_budgetconfig_det l4 
        ON l3.num_budgetconfig_headid = l4.num_budgetconfig_parentid
      INNER JOIN aoac_budgetaccmap_det 
        ON num_budgetaccmap_subgroup = l4.num_budgetconfig_headid
      LEFT JOIN transview 
        ON glcode = num_budgetaccmap_glcode 
       AND accno = num_budgetaccmap_accountno
    ) sub
    WHERE ulbid = :corpId
    GROUP BY ulbid, var_budgetconfig_budgetname
    HAVING SUM(num_budgetaccmap_budgetprov) > 0
    ORDER BY var_budgetconfig_budgetname
  `;

  const result = await executeQuery(query, { corpId });

  if (!result || result.success === false) {
    console.error("DB ERROR:", result?.error);
    return [];
  }

  return result.rows || result || [];
};

// ✅ Grants Grid (NO TRANSFORMATION)
const BindGrantsGrid = async (corpId) => {
  const query = `
    SELECT 
      dept.deptname,
      SUM(num_grant_amount) AS grants,
      SUM(NVL(num_grant_received,0)) AS received,
      SUM(NVL(num_grant_paid,0)) AS utilised,
      SUM(NVL(num_grant_received,0)) - SUM(NVL(num_grant_paid,0)) AS balance
    FROM AOAC_GRANT_DEF
    INNER JOIN accountview_web 
      ON num_grant_grantgl = glcode 
     AND num_grant_grantacc = accno 
     AND ulbid = num_grant_ulbid
    INNER JOIN prop.vw_deptconfig dept 
      ON dept.deptid = num_grant_nidhi_id 
     AND dept.ulbid = num_grant_ulbid
    WHERE num_grant_ulbid = :corpId
    GROUP BY dept.deptname
    ORDER BY dept.deptname
  `;

  const result = await executeQuery(query, { corpId });

  console.log("QUERY RESULT:", result);

  if (!result || result.success === false) {
    console.error("DB ERROR:", result?.error);
    return [];
  }

  return result.rows || result || [];
};

module.exports = {
  BindPayModeGrid,
  BindReceiptGrid,
  BindGrantsGrid,
};
