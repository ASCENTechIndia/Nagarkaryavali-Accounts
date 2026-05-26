const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { withTx } = require("../../../db/tx");

// 1. Get Departments
async function getDepartments(ulbId) {
  const sql = `
    SELECT deptname, deptid
    FROM prop.vw_deptconfig
    WHERE ulbid = :ulbId
  `;

  const result = await executeQuery(sql, { ulbId });
  if (!result.success) throw new Error(result.error);
  return result.rows;
}

// 2. Summary Report
async function getBankDepositSummary(filters) {
  let params = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    ulbId: filters.ulbId
  };

  let sql = `
    SELECT 
      department, glcode, accno,
      SUM(amount) AS amount,
      deptid, accountname, glcodeg, accnog
    FROM vw_bankdeposit
    WHERE TRUNC(recdate) BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD')
      AND TO_DATE(:toDate,'YYYY-MM-DD')
      AND ulb = :ulbId
      AND rmode IN ('8','41')
  `;

  if (filters.zoneId) {
    sql += " AND zoneid = :zoneId";
    params.zoneId = filters.zoneId;
  }

  if (filters.deptId) {
    sql += " AND deptid = :deptId";
    params.deptId = filters.deptId;
  }

  if (filters.collectionId) {
    sql += " AND collid = :collId";
    params.collId = filters.collectionId;
  }

  sql += `
    GROUP BY department, glcode, accno, deptid, accountname, glcodeg, accnog
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) throw new Error(result.error);
  return result.rows;
}

// 3. Account Wise Report
async function getAccountWiseReport(filters) {
  let params = {
    ulbId: filters.ulbId,

    // ✅ Convert JS date → Oracle DATE
    fromDate: new Date(filters.fromDate),
    toDate: new Date(filters.toDate)
  };

  let sql = `
    SELECT 
      glcode, accno, glname, accountname,
      challano, recdate,
      'Bank' AS rmode,
      SUM(amount) AS amount
    FROM vw_bankdeposit
    WHERE TRUNC(recdate) BETWEEN :fromDate AND :toDate
      AND ulb = :ulbId
      AND rmode IN ('8','41')
  `;

  if (filters.zoneId) {
    sql += " AND zoneid = :zoneId";
    params.zoneId = filters.zoneId;
  }

  if (filters.deptId) {
    sql += " AND deptid = :deptId";
    params.deptId = filters.deptId;
  }

  if (filters.collId) {
    sql += " AND collid = :collId";
    params.collId = filters.collId;
  }

  sql += `
    GROUP BY glcode, accno, glname, accountname, challano, recdate
  `;

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 4. Challan Report
async function getChallanReport(filters) {
  let params = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    ulbId: filters.ulbId
  };

  let sql = `
    SELECT 
      recno, chequeno, challano,
      TRUNC(recdate) AS recdate,
      'Bank' AS rmode,
      SUM(amount) AS amount
    FROM vw_bankdeposit
    WHERE TRUNC(recdate) BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD')
      AND TO_DATE(:toDate,'YYYY-MM-DD')
      AND ulb = :ulbId
      AND rmode IN ('8','41')
  `;

  if (filters.zoneId) {
    sql += " AND zoneid = :zoneId";
    params.zoneId = filters.zoneId;
  }

  if (filters.deptId) {
    sql += " AND deptid = :deptId";
    params.deptId = filters.deptId;
  }

  if (filters.collId) {
    sql += " AND collid = :collId";
    params.collId = filters.collId;
  }

  sql += `
    GROUP BY recno, chequeno, challano, TRUNC(recdate)
  `;

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);
  return result.rows;
}

// 5. GL Search
async function searchGL(prefix) {
  const sql = `
    SELECT DISTINCT glcode, glsearchname, glfunction
    FROM view_glweb
    WHERE glfunction LIKE :prefix
       OR TRIM(UPPER(glsearchname)) LIKE :searchPattern
  `;

  const params = {
    prefix: `${prefix}%`,
    searchPattern: `%${prefix.toUpperCase()}%`
  };

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);
  return result.rows;
}


async function insertCashierReceipt(data) {
  return await withTx(async (connection) => {
    const result = await connection.execute(
      `BEGIN 
        aoac_cashierreceipt_bnkdpo_ins(
          :In_UserId,
          :In_ULBID,
          :In_ParamStr,
          :In_ParamStr2,
          :In_ParamStr3,
          TO_DATE(:In_Fromdate,'DD-MON-YYYY'),
          TO_DATE(:In_Todate,'DD-MON-YYYY'),
          :out_ReturnStr,
          :out_ErrorCode,
          :out_ErrorMsg
        );
      END;`,
      {
        In_UserId: data.userId,
        In_ULBID: data.ulbId,
        In_ParamStr: data.paramStr,
        In_ParamStr2: data.paramStr2,
        In_ParamStr3: data.paramStr3 || null,
        In_Fromdate: data.fromDate,
        In_Todate: data.toDate,

        out_ReturnStr: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 200 },
        out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 500 }
      }
    );

    return result.outBinds;
  });
}

async function getZoneDropdown({ deptId, ulbId }) {
  let sql = "";
  let params = {};

  if (deptId == "7") {
    sql = `
      SELECT var_prabhag_name AS name, num_prabhag_newid AS id
      FROM aoms_prabhag_mas
      WHERE num_prabhag_id <> '99'
      ORDER BY var_prabhag_prabhagcode
    `;
  }

  else if (deptId == "21") {
    sql = `
      SELECT prabhag_name AS name, prabhagid AS id
      FROM cfc.vw_zone
      WHERE ulbid = :ulbId
      GROUP BY prabhagid, prabhag_name
      ORDER BY prabhagid
    `;
    params.ulbId = ulbId;
  }

  else if (deptId == "24") {
    sql = `
      SELECT var_CollCenter_Name AS name, num_CollCenter_id AS id
      FROM aowt_CollCenter_mas
      GROUP BY var_CollCenter_Name, num_CollCenter_id
      ORDER BY num_CollCenter_id
    `;
  }

  else if (deptId == "9") {
    sql = `
      SELECT wardname AS name, wardid AS id
      FROM prop.vw_ward_mas
      WHERE ulbid = :ulbId
      GROUP BY wardid, wardname
      ORDER BY wardid
    `;
    params.ulbId = ulbId;
  }

  else {
    return [];
  }

  const result = await executeQuery(sql, params);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

module.exports = {
  getDepartments,
  getBankDepositSummary,
  getAccountWiseReport,
  getChallanReport,
  searchGL,
  insertCashierReceipt,
  getZoneDropdown
};