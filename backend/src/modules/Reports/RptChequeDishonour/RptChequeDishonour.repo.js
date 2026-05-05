const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");

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
          zoneid AS id
        FROM cfc.vw_zone 
        WHERE ulbid = :ulbId 
        GROUP BY zoneid, prabhag_name  
        ORDER BY zoneid
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

async function getCollectionCentersByZone(zoneId) {
  if (!zoneId) {
    throw new Error("Zone ID is required");
  }

  const getPrabhagIdSql = `
    SELECT num_prabhag_id AS prabhagId
    FROM aoms_prabhag_mas 
    WHERE num_prabhag_newid = :zoneId
    ORDER BY var_prabhag_prabhagcode
  `;

  const prabhagResult = await executeQuery(getPrabhagIdSql, { zoneId });
  
  if (!prabhagResult.success) {
    throw new Error(prabhagResult.error);
  }

  if (!prabhagResult.rows || prabhagResult.rows.length === 0) {
    return [];
  }

  const prabhagId = prabhagResult.rows[0].PRABHAGID;

  const getCollCentersSql = `
    SELECT 
      var_collcen_collcenname AS name, 
      var_collcen_collcenid AS id
    FROM aoms_collcen_mas 
    WHERE num_collcen_prabhagid = :prabhagId
  `;

  const collCenterResult = await executeQuery(getCollCentersSql, { prabhagId });
  
  if (!collCenterResult.success) {
    throw new Error(collCenterResult.error);
  }

  return collCenterResult.rows;
}

async function getChequeReturnList(deptId, ulbId, zoneId, collCenterId, fromDate, toDate) {
  if (!ulbId) {
    throw new Error("UlbId ID is required");
  }

  if (!fromDate || !toDate) {
    throw new Error("From date and To date are required");
  }

  let sql = "";
  let params = {};

  switch (deptId) {
    case "7":
      // Start with base SQL
      sql = `
        SELECT 
          a.var_prabhag_name AS zonename, 
          a.var_chqreturn_propno AS propno,  
          a.owner_name AS ownernm,  
          a.var_chqreturn_chqno AS chequeno, 
          a.date_rec_chequedt AS chequedt, 
          a.var_chqreturn_bank AS bankname,    
          a.var_chqreturn_recnono AS recno,
          a.date_rec_receiptdt AS recdate,  
          a.num_rec_mobile AS recmob,  
          a.amount AS amount, 
          a.chequebonusamt AS chequebncamt, 
          a.dat_chqreturn_insdate AS chequebncdt,   
          a.var_chqreturn_remark AS remarks 
        FROM chqreturn_report a  
        WHERE 1=1
          AND TRUNC(a.dat_chqreturn_insdate) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') AND TO_DATE(:toDate, 'DD-MON-YYYY')
      `;

      params = {
        fromDate: fromDate,
        toDate: toDate
      };

      if (collCenterId && collCenterId !== '-1' && collCenterId !== '') {
        sql += ` AND a.var_rec_connid = :collCenterId`;
        params.collCenterId = collCenterId;
      }

      if (zoneId && zoneId !== '-1' && zoneId !== '') {
        sql += ` AND a.num_collcen_prabhagid = :zoneId`;
        params.zoneId = zoneId;
      }

      sql += ` ORDER BY a.dat_chqreturn_insdate DESC`;
      break;

    case "21":
      sql = `
        SELECT 
          num_chqreturn_chqreturnid,
          dat_rec_receiptdt AS recdate,
          num_rec_collcenterid,
          prabhag_name AS zonename,
          var_rec_demandid AS propno, 
          var_rec_receiptno AS recno,
          var_rec_applname AS ownernm,
          num_rec_mobno AS mobno,
          num_rec_chqno AS chequeno,
          var_bank_name AS bankname,
          dat_rec_chqdt AS chequedt,
          num_rec_amount AS amount,
          var_chqreturn_remark AS remarks,
          dat_chqreturn_insdate AS chequebncdt,
          num_chqreturn_chqamt AS chequebncamt  
        FROM cfc.aofc_chqreturn_log 
        INNER JOIN cfc.aofc_rec_mas_his 
          ON num_rec_chqno = var_chqreturn_chqno 
        INNER JOIN cfc.vw_zone  
          ON prabhagid = num_rec_collcenterid 
        INNER JOIN cfc.aofc_bankbranch_mas 
          ON num_bankbranch_id = num_rec_branchid 
        INNER JOIN cfc.aofc_bank_mas 
          ON num_bank_id = num_bankbranch_bankid 
          AND var_rec_receiptno = var_chqreturn_recnono 
        WHERE TRUNC(dat_chqreturn_insdate) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') AND TO_DATE(:toDate, 'DD-MON-YYYY')
      `;

      params = {
        fromDate: fromDate,
        toDate: toDate
      };

      if (zoneId && zoneId !== '-1' && zoneId !== '') {
        sql += ` AND num_rec_collcenterid = :zoneId`;
        params.zoneId = zoneId;
      }

      sql += `
        GROUP BY 
          num_chqreturn_chqreturnid,
          dat_rec_receiptdt,
          num_rec_collcenterid,
          prabhag_name,
          var_rec_demandid,
          num_chqreturn_chqamt,
          var_rec_receiptno,
          var_rec_applname,
          num_rec_mobno,
          num_rec_chqno,
          var_bank_name,
          dat_rec_chqdt,
          num_rec_amount,
          var_chqreturn_remark,
          dat_chqreturn_insdate
        ORDER BY dat_chqreturn_insdate DESC
      `;
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

module.exports = {
  getZonesByDepartment,
  getCollectionCentersByZone,
  getChequeReturnList
};