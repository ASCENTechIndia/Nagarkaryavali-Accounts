// FrmBillRegisterRpt.repo.js

const { executeQuery } = require("../../../db/queryExecutor");

async function getBillRegisterReport(params) {
  const {
    fromDate,
    toDate,
    zoneId = null,  
    deptId = null,   
    partyId = [],   
    accno = null,   
    glcode = null,   
    ulbid = null    
  } = params;

  let query = `
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
      BILLAMOUNT,
      ZONEID,
      DEPTID,
      PARTYID,
      GLCODE,
      ACCNO
    FROM VW_BillRegisterdetails
    WHERE TRUNC(BILLDATE) BETWEEN
          TO_DATE(:fromDate, 'DD-MM-YYYY')
      AND TO_DATE(:toDate, 'DD-MM-YYYY')
  `;

  const bindParams = {
    fromDate,
    toDate
  };

  // Single-value filters
  if (zoneId) {
    query += ` AND ZONEID = :zoneId`;
    bindParams.zoneId = zoneId;
  }

  if (deptId) {
    query += ` AND DEPTID = :deptId`;
    bindParams.deptId = deptId;
  }

  if (accno) {
    query += ` AND ACCNO = :accno`;
    bindParams.accno = accno;
  }

  if (glcode) {
    query += ` AND GLCODE = :glcode`;
    bindParams.glcode = glcode;
  }

  if (ulbid) {
    query += ` AND ULBID = :ulbid`;
    bindParams.ulbid = ulbid;
  }

  // PARTYID array filter
  if (Array.isArray(partyId) && partyId.length > 0) {
    const placeholders = partyId
      .map((_, index) => `:partyId${index}`)
      .join(", ");

    query += ` AND PARTYID IN (${placeholders})`;

    partyId.forEach((id, index) => {
      bindParams[`partyId${index}`] = id;
    });
  }

  query += ` ORDER BY BILLNO, VOUCHERNO`;

  console.log("Query:", query);
  console.log("Bind Params:", bindParams);

  return await executeQuery(query, bindParams);
}

module.exports = {
  getBillRegisterReport,
};