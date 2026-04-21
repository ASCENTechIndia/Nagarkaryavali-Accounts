const { executeQuery } = require("../../../db/queryExecutor");

// Bill Register Report
async function getBillRegisterReport(params) {
  const query = `
    SELECT 
      DENSE_RANK() OVER (ORDER BY BILLNO) AS SERIALNO,
      BILLNO,
      BILLDATE,
      SYSTEMBILLNO,
      SYSTEMBILLDATE,
      VENDORNAME,
      REMARKS,
      VOUCHERNO,
      VOUCHERDATE,
      ORIGINAL_AMOUNT,
      PAYMENTAMOUNT,
      BALANCESAMT,
      ULBID,
      BILLAMOUNT
    FROM VW_BillRegisterdetails
    WHERE TRUNC(billdate) BETWEEN 
      TO_DATE(:fromDate, 'DD-MM-YYYY') 
      AND 
      TO_DATE(:toDate, 'DD-MM-YYYY')
    ORDER BY BILLNO, VOUCHERNO
  `;

  return await executeQuery(query, params);
}

module.exports = {
  getBillRegisterReport,
};