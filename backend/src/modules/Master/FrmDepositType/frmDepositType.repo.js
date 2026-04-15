const { executeQuery } = require("../../../db/queryExecutor");

async function getDepositTypeRepo({ ulbId }) {
  console.log("📤 Repo: Fetch Deposit Types", { ulbId });

  const sql = `
    SELECT 
      NUM_DEPOSITMST_DEPOSITTYPEID AS depid, 
      VAR_DEPOSITMST_DEPOSITTYPE AS depname,
      num_depositmst_ulbid
    FROM AOAC_DEPOSITTYPEMST_DEF 
    WHERE num_depositmst_ulbid = :ulbId
    ORDER BY NUM_DEPOSITMST_DEPOSITTYPEID
  `;

  const binds = { ulbId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getDepositTypeByIdRepo({ depId }) {
  console.log("📤 Repo: Fetch Deposit Type By ID", { depId });

  const sql = `
    SELECT 
      num_depositmst_deposittypeid AS depid,
      var_depositmst_deposittype AS depname,
      num_depositmst_ulbid
    FROM aoac_deposittypemst_def
    WHERE num_depositmst_deposittypeid = :depId
  `;

  const binds = { depId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

module.exports = {
  getDepositTypeRepo,
  getDepositTypeByIdRepo, 
};
