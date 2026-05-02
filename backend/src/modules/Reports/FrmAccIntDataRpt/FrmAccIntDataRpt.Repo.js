const { executeQuery } = require("../../../db/queryExecutor");

async function getDepartmentTransactionsRepo(params) {
  const query = `
    SELECT 
        var_dept_marname AS dept_name,
        TO_CHAR(dat_depttrns_transdate,'DD-MON-yyyy') AS transdate,
        var_recmode_name AS recmode,
        var_depttrns_description AS description,
        var_depttrns_receiptno AS receiptno,
        var_depttrns_chalanno AS chalanno,
        num_depttrns_discount AS discount,
        num_depttrns_access AS Advance,
        num_depttrns_deptid AS DeptId,
        (
            SELECT SUM(num_depttrnsdet_amountcr) 
            FROM aoac_depttrans_det  
            WHERE num_depttrnsdet_transid = num_depttrns_transid
              AND TRUNC(dat_depttrnsdet_insdate) >= TO_DATE(:fromDate,'DD-MON-YYYY')
              AND TRUNC(dat_depttrnsdet_insdate) <= TO_DATE(:toDate,'DD-MON-YYYY')
        ) AS Collection,
        CASE 
            WHEN var_depttrns_statusflag = 'D' THEN 'Deleted/Bounced' 
            ELSE 'Present' 
        END AS statusflag
    FROM aoac_depttrans_mas
    LEFT JOIN admins.aoms_dept_mas 
        ON num_dept_id = num_depttrns_deptid
    LEFT JOIN prop.aoms_recmode_mas 
        ON num_recmode_id = num_depttrns_paymodeid
    WHERE num_depttrns_ulbid = '2'
      AND (:status = '-1' OR var_depttrns_statusflag = :status)
      AND (:deptId = '-1' OR num_depttrns_deptid = :deptId)
      AND TRUNC(dat_depttrns_transdate) >= TO_DATE(:fromDate,'DD-MON-YYYY')
      AND TRUNC(dat_depttrns_transdate) <= TO_DATE(:toDate,'DD-MON-YYYY')
    ORDER BY dat_depttrns_transdate
  `;

  return await executeQuery(query, params);
}

async function getCorporationRepo(params) {
  const query = `
    SELECT CORPORATIONNAME, CORPORATIONID 
    FROM vw_corporation
  `;

  return await executeQuery(query, params);
}

module.exports = {
  getDepartmentTransactionsRepo, getCorporationRepo
};
