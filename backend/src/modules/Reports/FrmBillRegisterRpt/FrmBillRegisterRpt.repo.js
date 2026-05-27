// FrmBillRegisterRpt.repo.js

const { executeQuery } = require("../../../db/queryExecutor");

async function getBillRegisterReport(params) {
  const {
  fromDate,
  toDate,
  zoneId = null,
  deptId = [],
  partyId = [],
  accno = [],
  glcode = [],
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

// DEPTID array filter
if (Array.isArray(deptId) && deptId.length > 0) {
  const placeholders = deptId
    .map((_, index) => `:deptId${index}`)
    .join(", ");

  query += ` AND DEPTID IN (${placeholders})`;

  deptId.forEach((id, index) => {
    bindParams[`deptId${index}`] = id;
  });
}

// ACCNO array filter
if (Array.isArray(accno) && accno.length > 0) {
  const placeholders = accno
    .map((_, index) => `:accno${index}`)
    .join(", ");

  query += ` AND ACCNO IN (${placeholders})`;

  accno.forEach((id, index) => {
    bindParams[`accno${index}`] = id;
  });
}

// GLCODE array filter
if (Array.isArray(glcode) && glcode.length > 0) {
  const placeholders = glcode
    .map((_, index) => `:glcode${index}`)
    .join(", ");

  query += ` AND GLCODE IN (${placeholders})`;

  glcode.forEach((id, index) => {
    bindParams[`glcode${index}`] = id;
  });
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