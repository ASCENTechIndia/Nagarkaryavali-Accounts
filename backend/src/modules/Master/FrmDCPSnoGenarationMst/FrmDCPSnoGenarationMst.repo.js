const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { executeProcedure } = require("../../../db/procedureExecutor");

/**
 * Fetch employee details for DCPS Generation by Employee ID, Number, or Name
 * @param {Object} params
 * @param {number|string} [params.ulbId]
 * @param {number|string} [params.employeeId]
 * @param {string} [params.employeeNo]
 * @param {string} [params.employeeName]
 * @returns {Promise<Array>} Array of employee records
 */
async function getEmployeeByNoRepo({ ulbId, employeeId, employeeNo, employeeName }) {
  console.log("📤 Repo: Fetch Employee By Query:", { ulbId, employeeId, employeeNo, employeeName });

  const parsedEmpId = employeeId
    ? parseInt(employeeId, 10)
    : employeeNo && !isNaN(employeeNo)
    ? parseInt(employeeNo, 10)
    : null;

  const empNoStr = employeeNo ? String(employeeNo).trim() : null;

  const runQuery = async (targetUlbId) => {
    const sql = `
      SELECT 
        EM.num_employee_empid,
        EM.num_employee_ulbid,
        CASE 
          WHEN (EM.num_employee_ulbid = '751' OR EM.num_employee_ulbid = '870')
          THEN EM.var_employee_marname
          ELSE EM.var_employee_engname
        END employeename,
        EM.date_employee_dob,
        var_dcpsnogen_dcpsno,
        num_dcpsnogen_openingbal,
        EM.var_employee_engname,
        EM.var_employee_psntaddress,
        EM.var_employee_emailid,
        EM.num_employee_mobileno,
        NM.var_nominee_name,
        EM.date_employee_joindate,
        EM.date_employee_confirmdate,
        EM.date_employee_retiremntdate,
        EM.num_employee_bankaccno,
        CM.var_category_name,
        CASE 
          WHEN (ZM.ULBID = 2 AND ZM.ZONEID = 6)
          THEN 'मुख्यालय'
          ELSE ZONENAME
        END var_zone_name,
        DD.var_deptmst_deptnamee,
        var_deptslip_sequence,
        DS.var_desigmst_designationname designation,
        var_employee_oldempno
      FROM tmcpayroll.aopr_employee_def EM
      LEFT JOIN tmcpayroll.aopr_category_mas CM
        ON CM.num_category_id = EM.num_employee_paysheettype
      LEFT JOIN tmcpayroll.vw_zoneconfig ZM
        ON ZM.ZONEID = EM.num_employee_zone
        AND ZM.ulbid = EM.num_employee_ulbid
      LEFT JOIN tmcpayroll.aopr_deptmst_def DD
        ON DD.num_deptmst_deptid = EM.num_employee_deptid
      LEFT JOIN tmcpayroll.aopr_designationmst_def DS
        ON DS.num_desigmst_designationid = EM.num_employee_desigid
      LEFT JOIN tmcpayroll.aopr_deptslip_mas
        ON EM.num_employee_empid = num_deptslip_empid
        AND EM.num_employee_ulbid = num_deptslip_ulbid
      LEFT JOIN AOAC_DCPSNOGEN_mas
        ON EM.num_employee_empid = num_dcpsnogen_empid
        AND EM.num_employee_ulbid = num_dcpsnogen_ulbid
      LEFT JOIN (
        SELECT num_nominee_empid, num_nominee_ulbid, MAX(var_nominee_name) AS var_nominee_name
        FROM tmcpayroll.aopr_nominee_det
        GROUP BY num_nominee_empid, num_nominee_ulbid
      ) NM
        ON NM.num_nominee_empid = EM.num_employee_empid
        AND NM.num_nominee_ulbid = EM.num_employee_ulbid
      WHERE 
        (:ulbId IS NULL OR EM.num_employee_ulbid = :ulbId)
        AND (
          :employeeId IS NULL OR var_deptslip_sequence = :employeeId OR EM.var_employee_oldempno = :empNoStr
        )
        AND (
          :employeeName IS NULL OR UPPER(
            NVL(EM.var_employee_engname, '') || ' ' ||
            NVL(EM.var_employee_marname, '')
          ) LIKE '%' || UPPER(:employeeName) || '%'
        )
      ORDER BY EM.num_employee_empid
    `;

    const binds = {
      ulbId: targetUlbId ? parseInt(targetUlbId, 10) : null,
      employeeId: parsedEmpId,
      empNoStr: empNoStr,
      employeeName: employeeName ? String(employeeName).trim() : null,
    };

    const result = await executeQuery(sql, binds);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.rows || [];
  };

  // 1. Try with provided ulbId first
  let rows = [];
  if (ulbId) {
    rows = await runQuery(ulbId);
  }

  // 2. If not found or ulbId was not provided, search across all ULBs
  if (!rows || rows.length === 0) {
    rows = await runQuery(null);
  }

  return rows;
}

/**
 * Execute AOAC_DCPSNOGEN_INS stored procedure to generate and save DCPS number
 * @param {Object} params
 * @param {string} params.userId
 * @param {number|string} params.ulbId
 * @param {number|string} params.employeeId
 * @param {number|string} params.openingBalance
 * @returns {Promise<Object>} Out binds containing out_ErrorCode and out_ErrorMsg
 */
async function saveDCPSRepo({ userId, ulbId, employeeId, openingBalance }) {
  console.log("📤 Repo: Execute AOAC_DCPSNOGEN_INS:", { userId, ulbId, employeeId, openingBalance });

  const sql = `
    BEGIN
      AOAC_DCPSNOGEN_INS(
        :in_UserId,
        :in_UlbId,
        :in_EmpId,
        :in_OpeningBal,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_UserId: String(userId || "Admin"),
    in_UlbId: parseInt(ulbId, 10) || 930,
    in_EmpId: parseInt(employeeId, 10),
    in_OpeningBal: parseFloat(openingBalance) || 0,
    out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 500 },
  };

  const result = await executeProcedure({ sql, binds });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}

/**
 * Fetch generated DCPS list from AOAC_DCPSNOGEN_MAS
 * @param {Object} params
 * @param {number|string} [params.ulbId]
 * @returns {Promise<Array>} List of generated DCPS records
 */
async function getDCPSListRepo({ ulbId }) {
  console.log("📤 Repo: Fetch DCPS List:", { ulbId });

  const sql = `
    SELECT 
      D.NUM_DCPSNOGEN_ID AS ID,
      D.NUM_DCPSNOGEN_ULBID AS ULBID,
      D.NUM_DCPSNOGEN_EMPID AS EMPID,
      D.VAR_DCPSNOGEN_DCPSNO AS DCPS_NO,
      D.NUM_DCPSNOGEN_OPENINGBAL AS OPENING_BALANCE,
      D.VAR_DCPSNOGEN_INSBY AS INSBY,
      D.DATE_DCPSNOGEN_INSDT AS INSDT,
      EM.var_employee_engname AS EMP_NAME
    FROM AOAC_DCPSNOGEN_MAS D
    LEFT JOIN tmcpayroll.aopr_employee_def EM
      ON EM.num_employee_empid = D.NUM_DCPSNOGEN_EMPID
      AND EM.num_employee_ulbid = D.NUM_DCPSNOGEN_ULBID
    WHERE (:ulbId IS NULL OR D.NUM_DCPSNOGEN_ULBID = :ulbId)
    ORDER BY D.NUM_DCPSNOGEN_ID DESC
  `;

  const binds = { ulbId: ulbId ? parseInt(ulbId, 10) : null };
  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows || [];
}

module.exports = {
  getEmployeeByNoRepo,
  saveDCPSRepo,
  getDCPSListRepo,
};
