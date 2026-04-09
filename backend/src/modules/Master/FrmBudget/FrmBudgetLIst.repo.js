const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// 1. Budget List
async function getBudgetList(fromDate, toDate) {
  const sql = `
    SELECT 
      num_budget_budgetno,
      date_budget_budgetdate,
      var_budgethead_name,
      var_budget_naration,
      num_budget_budgamout,
      num_budget_budgetgl,
      num_budget_budgetaccno,
      num_budget_provision AS prov_amount 
    FROM AOAC_BUDGET_DEF 
    INNER JOIN aoac_budgethead_mst 
      ON num_budgethead_id = num_budget_budgetheadid 
    WHERE date_budget_budgetdate >= :fromDate
      AND date_budget_budgetdate <= :toDate
    ORDER BY num_budget_budgetno
  `;

  const result = await executeQuery(sql, { fromDate, toDate });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 2. GL List
async function getGLList() {
  const sql = `
    SELECT 
      (num_glmaster_glcode || ' - ' || var_glmaster_glname) AS gl_name,
      num_glmaster_glcode AS gl_code 
    FROM aoac_glmaster_def 
    WHERE num_glmaster_glsubtype NOT IN (1, 2)
    ORDER BY num_glmaster_glcode
  `;

  const result = await executeQuery(sql);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 3. Budget Head List
async function getBudgetHeadList() {
  const sql = `
    SELECT 
      num_budgethead_id AS value,
      var_budgethead_name AS label
    FROM aoac_budgethead_mst
    ORDER BY var_budgethead_name
  `;

  const result = await executeQuery(sql);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 4. Budget By ID
async function getBudgetById(budgetNo) {
  const sql = `
    SELECT 
      date_budget_budgetdate,
      num_budget_budgetheadid,
      num_budget_budgetgl,
      num_budget_budgetaccno,
      var_budget_naration,
      num_budget_budgamout,
      acc.glname,
      acc.accname,
      num_budget_provision AS prov_amount 
    FROM AOAC_BUDGET_DEF 
    INNER JOIN accountview_web acc 
      ON num_budget_budgetgl = acc.glcode 
      AND num_budget_budgetaccno = acc.accno 
    WHERE num_budget_budgetno = :budgetNo
  `;

  const result = await executeQuery(sql, { budgetNo });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 5. GL Search
async function searchGL(prefix) {
  const sql = `
    SELECT DISTINCT 
      glcode, 
      glsearchname, 
      glfunction 
    FROM view_glweb 
    WHERE glfunction LIKE :prefix 
       OR UPPER(glsearchname) LIKE UPPER(:search)
  `;

  const result = await executeQuery(sql, {
    prefix: `${prefix}%`,
    search: `%${prefix}%`,
  });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 6. Procedure
async function budgetProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_budget_ins_new(
            :In_ParamStr,
            :In_UserId,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          In_ParamStr: data.paramStr,
          In_UserId: data.userId,

          out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },
          out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 2000,
          },
        }
      );

      return res.outBinds;
    });

    return {
      success: true,
      errorCode: result.OUT_ERRORCODE,
      errorMsg: result.OUT_ERRORMSG,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  getBudgetList,
  getGLList,
  getBudgetHeadList,
  getBudgetById,
  searchGL,
  budgetProc,
};