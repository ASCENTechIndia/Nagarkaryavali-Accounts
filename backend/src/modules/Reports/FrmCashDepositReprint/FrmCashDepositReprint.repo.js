const { executeQuery } = require("../../../db/queryExecutor");

async function getReceiptReportRepo(payload) {
  console.log("📤 Repo: Fetch Receipt Report", payload);

  const { fromDate, toDate, ulbId, paymode } = payload;

  const sql = `
    SELECT
      num_receiptmst_refno AS refno,
      date_receiptmst_trnsdate AS recdate,
      SUM(num_cashier_amount) AS amount,
      num_receiptmst_recno AS recno,
      num_cashier_mode AS paymode,
      CASE WHEN num_cashier_mode = 1 THEN 'Cash' ELSE 'Cheque' END AS paymodename
    FROM aoac_receiptmst_def
    INNER JOIN aoac_receiptdet_def ON num_receiptdet_refno = num_receiptmst_refno
    INNER JOIN aoac_cashier_details ON var_cashier_receiptid = num_receiptmst_refno
    WHERE TRUNC(date_receiptmst_trnsdate)
      BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
      AND TO_DATE(:toDate,'DD-MM-YYYY')
      AND num_receiptmst_ulbid = :ulbId
      AND num_cashier_mode IN (:paymode)
      AND num_cashier_mode IN ('1','2')
    GROUP BY
      num_receiptmst_refno,
      date_receiptmst_trnsdate,
      num_cashier_mode,
      num_receiptmst_recno
  `;

  const binds = { fromDate, toDate, ulbId, paymode };

  const result = await executeQuery(sql, binds);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

async function getPayModesRepo(payload) {
  console.log("📤 Repo: Fetch Pay Modes", payload);

  const { ulbId } = payload;

  const sql = `
    SELECT
      paymode_name,
      paymode_id
    FROM cfc.vw_paymode
    WHERE ulbid = :ulbId
      AND paymode_id IN (1,2)
    ORDER BY paymode_name
  `;

  const binds = { ulbId };

  const result = await executeQuery(sql, binds);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

module.exports = {
  getReceiptReportRepo,
  getPayModesRepo,
};
