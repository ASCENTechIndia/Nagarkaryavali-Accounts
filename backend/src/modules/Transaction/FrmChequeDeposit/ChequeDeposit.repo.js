const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");


async function getBankDepositSummary(filters) {
  let conditions = `
        TRUNC(Recdate) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY')
        AND TO_DATE(:toDate, 'DD-MON-YYYY')
        AND ULB = :ulbId
        AND RMODE IN ('189', '253', '191', '2', '4', '207')
        
    `;
    //AND RMODE IN ('189', '253', '191') removed from above query

  const binds = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    ulbId: filters.ulbId,
  };

  if (filters.zoneId) {
    conditions += ` AND ZONEID = :zoneId`;
    binds.zoneId = filters.zoneId;
  }

  if (filters.deptId) {
    conditions += ` AND DEPTID = :deptId`;
    binds.deptId = filters.deptId;
  }

  if (filters.collId) {
    conditions += ` AND collid = :collId`;
    binds.collId = filters.collId;
  }

  const sql = `
        SELECT 
            bankname,
            department,
            SUM(amount) AS bamount
        FROM vw_bankdeposit
        WHERE ${conditions}
        GROUP BY bankname, department
        ORDER BY bankname
    `;

  return executeQuery(sql, binds);
}

async function getBankDepositDetails(filters) {

  let conditions = `
        TRUNC(Recdate) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY')
        AND TO_DATE(:toDate, 'DD-MON-YYYY')
        AND ULB = :ulbId
        AND RMODE IN ('189', '253', '191', '2', '4', '207')
        
    `;
    //AND RMODE IN ('189', '253', '191', '2', '4') removed form above query

  const binds = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    ulbId: filters.ulbId,
  };

  if (filters.bankNames) {

    if (!Array.isArray(filters.bankNames)) {
      filters.bankNames = [filters.bankNames];
    }

    const bankPlaceholders = filters.bankNames
      .map((_, index) => `:bank${index}`)
      .join(",");

    conditions += ` AND bankname IN (${bankPlaceholders})`;

    filters.bankNames.forEach((bank, index) => {
      binds[`bank${index}`] = bank;
    });
  }

  if (filters.zoneId) {
    conditions += ` AND ZONEID = :zoneId`;
    binds.zoneId = filters.zoneId;
  }

  if (filters.deptId) {
    conditions += ` AND DEPTID = :deptId`;
    binds.deptId = filters.deptId;
  }

  if (filters.collId) {
    conditions += ` AND collid = :collId`;
    binds.collId = filters.collId;
  }
  // WHEN RMODE = 189 THEN 'cheque'  removed from below CASE in future for LIVE RMODE should chnage
  const sql = `
        SELECT 
            RECNO,
            RECDATE,

            CASE 
                WHEN  RMODE IN ('189', '191', '2', '4', '207') THEN 'cheque'
                WHEN RMODE = 253 THEN 'DD / PO'
                ELSE 'Pay Order'
            END AS RMODE_DESC,

            DEPARTMENT,
            SUM(AMOUNT) AS AMOUNT,
            DEPTID,
            ZONEID,
            challano,
            bankname,
            cheqdt,
            chequeno,
            propno

        FROM vw_bankdeposit
        WHERE ${conditions}

        GROUP BY 
            RECNO,
            RECDATE,
            RMODE,
            DEPARTMENT,
            DEPTID,
            ZONEID,
            challano,
            bankname,
            cheqdt,
            chequeno,
            propno

        ORDER BY RECDATE DESC, RECNO
    `;

  return executeQuery(sql, binds);
}
async function getChequeDepositDetails(filters) {
  const sql = `
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
            ULBID,
            REFNO,
            VAR_BULKRECEIPT_CHALONNO,
            CHEQNO,
            CHEQDT,
            CHEQBANKNAME,
            AMOUNT
        FROM vw_chequedeposit
        WHERE REFNO = :refNo
          AND ULBID = :ulbId
        ORDER BY CHEQDT, CHEQNO
    `;

  const binds = {
    refNo: filters.refNo,
    ulbId: filters.ulbId,
  };

  return executeQuery(sql, binds);
}

async function getZoneList(zoneId) {
  const sql = `
        SELECT num_prabhag_id
        FROM aoms_prabhag_mas
        WHERE num_prabhag_newid = :zoneId
        ORDER BY var_prabhag_prabhagcode
    `;

  return executeQuery(sql, { zoneId });
}


async function getCollectionCenterList(prabhagId) {
  const sql = `
        SELECT 
            var_collcen_collcenname,
            var_collcen_collcenid
        FROM aoms_collcen_mas
        WHERE num_collcen_prabhagid = :prabhagId
        ORDER BY var_collcen_collcenid
    `;

  return executeQuery(sql, { prabhagId });
}
async function saveCashierReceipt(data) {
  return withTx(async (conn) => {
    const result = await conn.execute(
      `
      BEGIN
          aoac_cashierreceipt_ins(
              :In_UserId,
              :In_ULBID,
              :In_ParamStr,
              :In_ParamStr2,
              TO_DATE(:In_Fromdate, 'DD-MON-YYYY'),
              TO_DATE(:In_Todate, 'DD-MON-YYYY'),
              :out_ReturnStr,
              :out_ErrorCode,
              :out_ErrorMsg
          );
      END;
      `,
      {
        In_UserId: data.userId,
        In_ULBID: data.ulbId,
        In_ParamStr: data.paramStr,
        In_ParamStr2: data.paramStr2,
        In_Fromdate: data.fromDate,
        In_Todate: data.toDate,

        out_ReturnStr: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 500,
        },

        out_ErrorCode: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER,
        },

        out_ErrorMsg: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 4000,
        },
      },

      {
        autoCommit: false,
      }
    );

    return {
      returnStr: result.outBinds.out_ReturnStr,
      errorCode: result.outBinds.out_ErrorCode,
      errorMsg: result.outBinds.out_ErrorMsg,
    };
  });
}

module.exports = {
  getBankDepositSummary,
  getBankDepositDetails,
  getChequeDepositDetails,
  getZoneList,
  getCollectionCenterList,
  saveCashierReceipt,
};