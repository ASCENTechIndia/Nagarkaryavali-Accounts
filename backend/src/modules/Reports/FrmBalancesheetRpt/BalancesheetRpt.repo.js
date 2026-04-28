const { executeQuery } = require("../../../db/queryExecutor");

// ================= SUMMARY ================= // 0


const getBalanceSheetSummary = async ({ fromDate, corp_id }) => {
  const query = `
    WITH bal AS (
      SELECT ulbid, glcode, accno, NVL(SUM(amount),0) TrnsAmount
      FROM transview
      WHERE ulbid = :corp_id AND TRUNC(trnsdate) <= TO_DATE(:fromDate,'DD-MM-YYYY')
      GROUP BY ulbid, glcode, accno
    )
    SELECT 
      m.num_blsheet_id id,
      m.var_blsheet_head heading,
      m.var_blsheet_code mcode,
      m.var_blsheet_desc description,
      m.var_blsheet_schedule schno,
      m.num_blsheet_groupid groupid,
      m.var_blsheet_type type,
      SUM(NVL(TrnsAmount,0)) currentyear,
      SUM(NVL(num_accmst_openbal,0)) previousyear
    FROM aoac_blsheet_def m
    LEFT JOIN aoac_blsheet_det d ON m.num_blsheet_id = d.num_blsheet_id
    LEFT JOIN aoac_accmaster_def 
      ON num_accmaster_ulbid = 5 
      AND var_accmst_object = d.var_blsheet_code
    LEFT JOIN bal 
      ON num_accmaster_ulbid = ulbid 
      AND num_accmaster_glcode = glcode 
      AND num_accmaster_accno = accno
    GROUP BY 
      m.num_blsheet_id, m.var_blsheet_head, m.var_blsheet_code,
      m.var_blsheet_desc, m.var_blsheet_schedule,
      m.num_blsheet_groupid, m.var_blsheet_type
    ORDER BY m.num_blsheet_id
  `;

  const result = await executeQuery(query, { fromDate, corp_id });

  if (!result.success) throw new Error(result.error);

  return result.rows;
};

// ================= DETAILS ================= //1
const getBalanceSheetDetails = async ({ fromDate, corp_id }) => {
  const query = `
    WITH bal AS (
      SELECT ulbid, glcode, accno, NVL(SUM(amount),0) TrnsAmount
      FROM transview
      WHERE ulbid = :corp_id AND trnsdate <= TO_DATE(:fromDate,'DD-MM-YYYY')
      GROUP BY ulbid, glcode, accno
    )
    SELECT 
      m.num_blsheet_id id,
      m.var_blsheet_head heading,
      m.var_blsheet_code mcode,
      m.var_blsheet_desc description,
      m.var_blsheet_schedule schno,
      m.num_blsheet_groupid groupid,
      m.var_blsheet_type type,
      d.var_blsheet_code schcode,
      var_balsheet_groupname schedulename,
      SUM(NVL(TrnsAmount,0)) currentyear,
      SUM(NVL(num_accmst_openbal,0)) previousyear
    FROM aoac_blsheet_def m
    LEFT JOIN aoac_blsheet_det d ON m.num_blsheet_id = d.num_blsheet_id
    INNER JOIN aoac_balancesht_mst 
      ON var_balsheet_groupcode = d.var_blsheet_code
    LEFT JOIN aoac_accmaster_def 
      ON num_accmaster_ulbid = 5 
      AND var_accmst_object = d.var_blsheet_code
    LEFT JOIN bal 
      ON num_accmaster_ulbid = ulbid 
      AND num_accmaster_glcode = glcode 
      AND num_accmaster_accno = accno
    WHERE d.var_blsheet_code IS NOT NULL
    GROUP BY 
      m.num_blsheet_id, m.var_blsheet_head, m.var_blsheet_code,
      m.var_blsheet_desc, m.var_blsheet_schedule,
      m.num_blsheet_groupid, m.var_blsheet_type,
      d.var_blsheet_code, var_balsheet_groupname
    ORDER BY m.num_blsheet_id, d.var_blsheet_code
  `;

  const result = await executeQuery(query, { fromDate, corp_id });

  if (!result.success) throw new Error(result.error);

  return result.rows;
};

module.exports = {
  getBalanceSheetSummary,
  getBalanceSheetDetails,
};
