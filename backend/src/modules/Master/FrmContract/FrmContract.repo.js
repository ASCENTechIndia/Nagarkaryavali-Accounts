const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

async function getZones(ulbId) {
  const sql = `
    SELECT 
        *
    FROM aoac_zonemst_def
    WHERE 
       num_zonemst_corpid  = :ulbId
  `;

  const result = await executeQuery(sql, { ulbId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getContractList(zoneId, ulbId) {
  const sql = `
    SELECT 
        num_contractmst_id AS id, 
        date_contractmst_date AS contractdate, 
        var_partymst_partyname AS partyname, 
        num_contractmst_amount AS amount, 
        date_contractmst_startdate AS startdate, 
        date_contractmst_enddate AS enddate 
    FROM 
        aoac_contract_mst_def 
    INNER JOIN 
        aoac_partymst_def ON num_contractmst_contractorid = num_partymst_partyid 
    WHERE 
        num_contractmst_zoneid = :zoneId
        AND num_contractmst_ulbid = :ulbId
    ORDER BY 
        num_contractmst_id DESC
  `;

  const result = await executeQuery(sql, { zoneId, ulbId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getContractById(contractId) {
  const sql = `
    SELECT 
      date_contractmst_date AS Contractdate, 
      num_contractmst_contractorid AS contractorid, 
      var_partymst_partyname AS contractorname, 
      num_contractmst_amount AS contract_amount, 
      var_contractmst_desc AS descpn, 
      date_contractmst_startdate AS startdate, 
      date_contractmst_enddate AS enddate, 
      num_contractmst_drgl AS drgl, 
      num_contractmst_dracc AS dracc, 
      dr.glname AS glnamedr, 
      dr.accname AS accnamedr, 
      num_contractmst_crgl AS crgl, 
      num_contractmst_cracc AS cracc, 
      cr.glname AS glnamecr, 
      cr.accname AS accnamecr, 
      var_contractdet_accyr AS accyr, 
      num_contractdet_amount AS amount_dtl, 
      var_contractdet_desc AS desc_dtl, 
      num_contractdet_transno AS transno,
      var_contractmst_adminapl,
      date_contractmst_techapldate,
      var_contractmst_newspaper,
      var_contractmst_newspaper_date,
      var_contractmst_newspaperapp,
      var_contractmst_workorder,
      num_contractmst_zoneid 
  FROM 
      aoac_contract_mst_def 
  INNER JOIN 
      aoac_contract_det_def 
      ON num_contractdet_id = num_contractmst_id 
  INNER JOIN 
      aoac_partymst_def 
      ON num_contractmst_contractorid = num_partymst_partyid 
  LEFT JOIN 
      accountview_web dr 
      ON dr.glcode = num_contractmst_drgl 
      AND dr.accno = num_contractmst_dracc  
  LEFT JOIN 
      accountview_web cr 
      ON cr.glcode = num_contractmst_crgl 
      AND cr.accno = num_contractmst_cracc  
  WHERE
      num_contractmst_id = :contractId 
  ORDER BY 
      var_contractdet_accyr
  `;

  const result = await executeQuery(sql, { contractId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getContractDetails(contractId) {
  const sql = `
    SELECT 
        var_contractdet_accyr AS AccYear,
        NVL(num_contractdet_amount, 0) AS Amount,
        var_contractdet_desc AS Descb,
        NVL(num_contractdet_transno, 0) AS TrnsNo
    FROM 
        aoac_contract_det_def 
    WHERE 
        num_contractdet_id = :contractId
    ORDER BY 
        var_contractdet_accyr
  `;

  const result = await executeQuery(sql, { contractId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function searchGL(functioncode, ulbId, searchText = "") {
  let sql = `
    SELECT 
        objectcode,
        objectcode || '-' || accname AS accname 
    FROM 
        accountview_web 
    WHERE 
        1 = 1
        AND ulbid = :ulbId
  `;
  
  const params = { ulbId };
  
  if (functioncode) {
    sql += ` AND functioncode = :functioncode`;
    params.functioncode = functioncode;
  }
  
  if (searchText) {
    sql += ` AND (UPPER(objectcode) LIKE UPPER(:searchText) OR UPPER(accname) LIKE UPPER(:searchText))`;
    params.searchText = `%${searchText}%`;
  }
  
  sql += ` ORDER BY objectcode`;

  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function searchContractor(searchText, ulbId) {
  const sql = `
    SELECT 
        num_partymst_partyid || '-' || var_partymst_partyname AS partyname,
        num_partymst_partyid AS partyid,
        var_partymst_partyname AS name
    FROM 
        aoac_partymst_def 
    WHERE 
        (UPPER(var_partymst_partyname) LIKE UPPER(:searchText) 
         OR TO_CHAR(num_partymst_partyid) LIKE :searchTextId)
        AND num_partymst_ulbid = :ulbId
    ORDER BY 
        var_partymst_partyname
  `;

  const result = await executeQuery(sql, { 
    searchText: `%${searchText}%`,
    searchTextId: `%${searchText}%`,
    ulbId 
  });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function contractMasterProc(data) {
  try {
    const formatDateForOracle = (dateStr) => {
      if (!dateStr) return "";
      
      let date;
      if (dateStr instanceof Date) {
        date = dateStr;
      } else if (typeof dateStr === 'string') {
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateStr);
        } else if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
          const parts = dateStr.split('-');
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          date = new Date(dateStr);
        }
      } else {
        return "";
      }
      
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateStr);
        return "";
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Get the outBinds directly from withTx (like reference code)
    const outBinds = await withTx(async (conn) => {
      const formattedContractDate = formatDateForOracle(data.contractDate);
      const formattedStartDate = formatDateForOracle(data.startDate);
      const formattedEndDate = formatDateForOracle(data.endDate);
      const formattedTechApprovalDate = data.technicalApprovalDate ? formatDateForOracle(data.technicalApprovalDate) : "";
      const formattedNewspaperDate = data.newspaperDate ? formatDateForOracle(data.newspaperDate) : "";
      const formattedWorkOrder = data.workOrder ? formatDateForOracle(data.workOrder) : "";

      const paramStr = [
        data.contractorId || '',
        formattedContractDate,
        data.amount || '',
        formattedStartDate,
        formattedEndDate,
        data.description || '',
        data.drgl || '',
        data.dracc || '',
        data.crgl || '',
        data.cracc || '',
        data.administrativeApproval || '',
        formattedTechApprovalDate,
        data.newspaper || '',
        formattedNewspaperDate,
        data.newspaperApproval || '',
        formattedWorkOrder
      ].join('~');

      let paramStr2 = "";
      if (data.contractDetails && data.contractDetails.length > 0) {
        const detailsArray = data.contractDetails.map(detail => 
          `${detail.accyr}#${detail.amount}#${detail.description || ''}`
        );
        paramStr2 = detailsArray.join('$');
      } else {
        throw new Error("Contract details are required");
      }
      
      const res = await conn.execute(
        `BEGIN 
            aoac_contractentry_ins(
              :in_UserId,
              :in_zoneId,
              :in_ParamStr,
              :in_ParamStr2,
              :in_contractid,
              :in_mode,
              :out_ReturnStr,
              :out_ErrorCode,
              :out_ErrorMsg
            );
         END;`,
        {
          in_UserId: data.userId,
          in_zoneId: data.zoneId,
          in_ParamStr: paramStr,
          in_ParamStr2: paramStr2,
          in_contractid: data.contractId || 0,
          in_mode: data.mode,
          out_ReturnStr: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 2000
          },
          out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
          },
          out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 2000
          }
        }
      );

      console.log("Procedure out binds:", res.outBinds);
      
      return res.outBinds;
    });

    console.log("Out binds from withTx:", outBinds);

    return {
      success: true,
      errorCode: outBinds.out_ErrorCode,
      errorMsg: outBinds.out_ErrorMsg,
      returnStr: outBinds.out_ReturnStr
    };

  } catch (err) {
    console.error("Procedure error:", err);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  getContractList,
  getContractById,
  getContractDetails,
  searchGL,
  searchContractor,
  getZones,
  contractMasterProc
};