const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

async function getZonesByDepartment(deptId, ulbId) {
  let sql = "";
  const params = {};

  switch (deptId) {
    case "7":
      sql = `
        SELECT 
          var_prabhag_name AS name, 
          num_prabhag_newid AS id
        FROM aoms_prabhag_mas 
        WHERE num_prabhag_id <> '99' 
        ORDER BY var_prabhag_prabhagcode
      `;
      break;

    case "21":
      if (!ulbId) {
        throw new Error("UlbId ID is required for department 21");
      }
      sql = `
        SELECT 
          prabhag_name AS name, 
          prabhagid AS id
        FROM cfc.vw_zone 
        WHERE ulbid = :ulbId 
        GROUP BY prabhagid, prabhag_name  
        ORDER BY prabhagid
      `;
      params.ulbId = ulbId;
      break;

    case "24":
      sql = `
        SELECT 
          var_CollCenter_Name AS name, 
          num_CollCenter_id AS id
        FROM aowt_CollCenter_mas  
        GROUP BY var_CollCenter_Name, num_CollCenter_id 
        ORDER BY num_CollCenter_id
      `;
      break;

    case "9":
      if (!ulbId) {
        throw new Error("UlbId ID is required for department 9");
      }
      sql = `
        SELECT 
          wardname AS name, 
          wardid AS id
        FROM prop.vw_ward_mas 
        WHERE ulbid = :ulbId  
        GROUP BY wardid, wardname  
        ORDER BY wardid
      `;
      params.ulbId = ulbId;
      break;

    default:
      return [];
  }

  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getCashDepositTransactions(params) {
  let sql = `
    SELECT 
      DEPARTMENT, 
      glcode, 
      accno, 
      SUM(AMOUNT) AS AMOUNT, 
      DEPTID, 
      accountname, 
      glcodeg, 
      accnog 
    FROM vw_bankdeposit 
    WHERE TRUNC(Recdate) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') AND TO_DATE(:toDate, 'DD-MON-YYYY')
      AND ULB = :ulbId
      AND RMODE = '1'
  `;

  const queryParams = {
    fromDate: params.fromDate,
    toDate: params.toDate,
    ulbId: params.ulbId
  };

  if (params.zoneId && params.zoneId !== '-1' && params.zoneId !== '') {
    sql += ` AND ZONEID = :zoneId`;
    queryParams.zoneId = params.zoneId;
  }

  if (params.deptId && params.deptId !== '-1' && params.deptId !== '') {
    sql += ` AND DEPTID = :deptId`;
    queryParams.deptId = params.deptId;
  }

  if (params.collId && params.collId !== '-1' && params.collId !== '' && params.collId !== '0') {
    sql += ` AND collid = :collId`;
    queryParams.collId = params.collId;
  }

  if (params.recNos && params.recNos.length > 0) {
    const recNoPlaceholders = params.recNos.map((_, idx) => `:recNo${idx}`).join(',');
    sql += ` AND recno IN (${recNoPlaceholders})`;
    params.recNos.forEach((recNo, idx) => {
      queryParams[`recNo${idx}`] = recNo;
    });
  }

  if (params.accNos && params.accNos.length > 0) {
    const accNoPlaceholders = params.accNos.map((_, idx) => `:accNo${idx}`).join(',');
    sql += ` AND ACCNOG IN (${accNoPlaceholders})`;
    params.accNos.forEach((accNo, idx) => {
      queryParams[`accNo${idx}`] = accNo;
    });
  }

  if (params.challanNos && params.challanNos.length > 0) {
    const challanPlaceholders = params.challanNos.map((_, idx) => `:challanNo${idx}`).join(',');
    sql += ` AND challano IN (${challanPlaceholders})`;
    params.challanNos.forEach((challanNo, idx) => {
      queryParams[`challanNo${idx}`] = challanNo;
    });
  }

  sql += ` GROUP BY glcode, accno, DEPARTMENT, DEPTID, accountname, glcodeg, accnog 
           ORDER BY DEPARTMENT, glcode, accno`;

  const result = await executeQuery(sql, queryParams);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getCashDenominations() {
  const sql = `
    SELECT 
      num_cashdenom_name AS name, 
      num_cashdenom_id AS id
    FROM aoac_cashdenom_mst 
    ORDER BY num_cashdenom_name DESC
  `;

  const result = await executeQuery(sql);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getTapshilReceipts(params) {
  let sql = `
    SELECT 
      recno, 
      chequeno, 
      challano, 
      TRUNC(Recdate) AS Recdate, 
      rmode, 
      recmodname, 
      SUM(amount) AS amount 
    FROM vw_bankdeposit 
    INNER JOIN prop.vw_recmodeconfig ON recmodeid = rmode AND ulbid = ulb 
    WHERE TRUNC(Recdate) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') AND TO_DATE(:toDate, 'DD-MON-YYYY')
      AND ULB = :ulbId
      AND RMODE = '1'
  `;

  const queryParams = {
    fromDate: params.fromDate,
    toDate: params.toDate,
    ulbId: params.ulbId
  };

  if (params.zoneId && params.zoneId !== '-1' && params.zoneId !== '') {
    sql += ` AND ZONEID = :zoneId`;
    queryParams.zoneId = params.zoneId;
  }

  if (params.deptId && params.deptId !== '-1' && params.deptId !== '') {
    sql += ` AND DEPTID = :deptId`;
    queryParams.deptId = params.deptId;
  }

  if (params.collId && params.collId !== '-1' && params.collId !== '' && params.collId !== '0') {
    sql += ` AND collid = :collId`;
    queryParams.collId = params.collId;
  }

  sql += ` GROUP BY recno, chequeno, challano, TRUNC(Recdate), rmode, recmodname
           ORDER BY Recdate DESC, recno`;

  const result = await executeQuery(sql, queryParams);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getLekhashirshDetails(params) {
  let sql = `
    SELECT 
      glcode, 
      accno, 
      glname, 
      accountname, 
      challano, 
      Recdate, 
      rmode, 
      recmodname, 
      SUM(amount) AS amount 
    FROM vw_bankdeposit 
    INNER JOIN prop.vw_recmodeconfig ON recmodeid = rmode AND ulbid = ulb 
    WHERE TRUNC(Recdate) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') AND TO_DATE(:toDate, 'DD-MON-YYYY')
      AND ULB = :ulbId
      AND RMODE = '1'
  `;

  const queryParams = {
    fromDate: params.fromDate,
    toDate: params.toDate,
    ulbId: params.ulbId
  };

  if (params.zoneId && params.zoneId !== '-1' && params.zoneId !== '') {
    sql += ` AND ZONEID = :zoneId`;
    queryParams.zoneId = params.zoneId;
  }

  if (params.deptId && params.deptId !== '-1' && params.deptId !== '') {
    sql += ` AND DEPTID = :deptId`;
    queryParams.deptId = params.deptId;
  }

  if (params.collId && params.collId !== '-1' && params.collId !== '' && params.collId !== '0') {
    sql += ` AND collid = :collId`;
    queryParams.collId = params.collId;
  }

  sql += ` GROUP BY glcode, accno, glname, accountname, challano, Recdate, rmode, recmodname
           ORDER BY glcode, accno`;

  const result = await executeQuery(sql, queryParams);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getCashDepositByRefNo(refNo, ulbId, hasDenomination = true) {

  const viewName = hasDenomination
    ? "vw_cashdeposit"
    : "vw_cashdepositnodeno";

  let sql = `
    SELECT
      BANKNAME,
      BRANCHNAME,
      PANNO,
      NUM_RECEIPTMST_TRNSTYPEID,
      ACTYPE,
      ACCNO,
      ZONEID,
      TRANSDATE,
      PAVTINNO,
      AMT,
      QTY,
      DEAMT,
      ULBID
    FROM ${viewName}
    WHERE REFNO = :refNo
      AND ULBID = :ulbId
  `;

  if (hasDenomination) {
    sql += ` AND QTY IS NOT NULL`;
  }

  const result = await executeQuery(sql, { refNo, ulbId });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function insertBankDeposit(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
            aoac_Cashierreceipt_bnkdpo_ins(
              :in_UserId,
              :in_ULBID,
              :in_ParamStr,
              :in_ParamStr2,
              :in_ParamStr3,
              :in_Fromdate,
              :in_Todate,
              :out_ReturnStr,
              :out_ErrorCode,
              :out_ErrorMsg
            );
         END;`,
        {
          in_UserId: data.userId || null,
          in_ULBID: data.ulbId,
          in_ParamStr: data.paramStr,
          in_ParamStr2: data.paramStr1,
          in_ParamStr3: data.paramStr2 || null,
          in_Fromdate: { type: oracledb.DATE, val: new Date(data.fromDate) },
          in_Todate: { type: oracledb.DATE, val: new Date(data.toDate) },
          out_ReturnStr: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 1000
          },
          out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
          },
          out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 1000
          }
        }
      );

      console.log("insertBankDeposit", res);

      return res.outBinds;
    });

    return {
      success: true,
      returnStr: result.out_ReturnStr,
      errorCode: result.out_ErrorCode,
      errorMsg: result.out_ErrorMsg
    };

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

async function insertCashDenominationCashier(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
            aoac_cashdenomcashier_ins(
              :in_userid,
              :in_Dept,
              :in_challan,
              :in_denomDate,
              :in_denomstr,
              :in_Transno,
              :in_receiptno,
              :in_Mode,
              :in_ULBID,
              :out_errormsg,
              :out_errorcode
            );
         END;`,
        {
          in_userid: data.userId,
          in_Dept: data.deptId,
          in_challan: data.challanNo || null,
          in_denomDate: data.denomDate ? { type: oracledb.DATE, val: new Date(data.denomDate) } : null,
          in_denomstr: data.denomStr,
          in_Transno: data.transNo,
          in_receiptno: data.receiptNo,
          in_Mode: data.mode,
          in_ULBID: data.ulbId,
          out_errormsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 1000
          },
          out_errorcode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
          }
        }
      );

      console.log("insertCashDenominationCashier", res);

      return res.outBinds;
    });

    return {
      success: true,
      errorMsg: result.out_errormsg,
      errorCode: result.out_errorcode
    };

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  getZonesByDepartment,
  getCashDepositTransactions,
  getCashDenominations,
  getTapshilReceipts,
  getLekhashirshDetails,
  getCashDepositByRefNo,
  insertBankDeposit,
  insertCashDenominationCashier
};