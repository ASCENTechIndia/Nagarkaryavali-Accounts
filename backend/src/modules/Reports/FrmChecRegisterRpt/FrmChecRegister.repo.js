const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");


async function getChequeRegisterReport(filters) {
  let params = {
    ulbId: filters.ulbId,
    fromDate: filters.fromDate, // Format: 'DD-MON-YYYY'
    toDate: filters.toDate
  };

  let sql = `
    SELECT 
      CHEQNO, CHEQDATE, VCHNO, VCHODATE, SYSTEMBILLNO, SYSTEMBILLDATE, 
      GROSSAMT, CHEQAMT, REMARK, PAYEENAME, ULBID, TDS, RECEIPIENTSIGN, 
      CHEQRELIDATE, BANKNAME, BANKAC, ACCNAME, ACCNO, NETAMOUNT, 
      TRANSNO, PREPVCHNO 
    FROM vw_cheqregisterdetails
    WHERE TRUNC(CHEQDATE) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') AND TO_DATE(:toDate, 'DD-MON-YYYY')
      AND ULBID = :ulbId
  `;

  // 1. GL Code Filter (Major/Function and Minor/Object codes)
  if (filters.chkGLCode) {
    sql += " AND FUNCTIONCODE = :functionCode AND OBJECTCODE = :objectCode ";
    params.functionCode = filters.majorCode;
    params.objectCode = filters.minorCode;
  }

  // 2. Party Search Filter
  if (filters.partyId && filters.partyId !== "") {
    sql += " AND PARTYID = :partyId ";
    params.partyId = filters.partyId;
  }

  // 3. MBMC Specific Filters (Budget & Nidhi)
  if (filters.corpCode === "MBMC") {
    if (filters.budgetId && filters.budgetId !== "0") {
      sql += " AND BUDGETID = :budgetId ";
      params.budgetId = filters.budgetId;
    }
    if (filters.nidhiId && filters.nidhiId !== "0" && filters.nidhiId !== "") {
      sql += " AND NIDHIID = :nidhiId ";
      params.nidhiId = filters.nidhiId;
    }
  }

  sql += " ORDER BY BANKNAME, VCHNO, CHEQNO ";

  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function searchAccounts(filters) {
  const { prefix, dbGlCode, ulbId } = filters;
  
  let params = {
    ulbId: ulbId,

    searchPattern: `%${prefix}%`
  };

  let sql = `
    SELECT 
      accsearchname, 
      accno, 
      functioncode, 
      objectcode, 
      accountsearchname 
    FROM accountview_web 
    WHERE ulbid = :ulbId
      AND (objectcode LIKE :searchPattern OR accsearchname LIKE :searchPattern)
  `;

  // If a specific GL/Function code is provided, restrict the search
  if (dbGlCode && dbGlCode.trim() !== "") {
    sql += " AND functioncode = :dbGlCode ";
    params.dbGlCode = dbGlCode;
  }

  // Limit results for autocomplete performance
  sql += " FETCH FIRST 50 ROWS ONLY ";

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


async function searchGLHeads(filters) {
  const { prefix } = filters;
  
  // We prepare the pattern for the search name with wildcards
  const searchPattern = `%${prefix.trim().toUpperCase()}%`;

  const sql = `
    SELECT DISTINCT 
      glcode, 
      glsearchname, 
      glfunction 
    FROM view_glweb 
    WHERE (
        glfunction LIKE :prefix 
        OR TRIM(UPPER(glsearchname)) LIKE :searchPattern
    )
    ORDER BY glfunction
  `;

  const params = {
    prefix: `${prefix}%`, // Allows code-based search to act as a prefix search
    searchPattern: searchPattern
  };

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}
module.exports={

    getChequeRegisterReport,
    searchAccounts,
    searchGLHeads,

}