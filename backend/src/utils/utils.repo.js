const { executeQuery } = require("../db/queryExecutor");
const { withTx } = require("../db/tx");

async function getUserTypeList() {
  const sql = `
    SELECT
      num_usertype_id,var_usertype_name from admins.aoma_usertype_def
    ORDER BY num_usertype_id
  `;

  return executeQuery(sql);
}
async function getCollCenterList() {
  const sql = `
    SELECT
       collcenid zoneid ,collcenname zonename from view_coll_center
    ORDER BY collcenid
  `;

  return executeQuery(sql);
}
async function getPrabhagList() {
  const sql = `
    SELECT
      var_prabhag_name AS prabhag_name,
      num_prabhag_id   AS prabhag_id
    FROM aoms_prabhag_mas
    ORDER BY num_prabhag_id
  `;
  return executeQuery(sql);
}
async function getPrabhagById(prabhagId) {
  const sql = `
    SELECT
      var_prabhag_name AS prabhag_name,
      num_prabhag_id   AS prabhag_id
    FROM aoms_prabhag_mas
    WHERE num_prabhag_id = $1
    ORDER BY num_prabhag_id
  `;
  return executeQuery(sql, [prabhagId]);
}

async function getReceiptModeList() {
  const sql = `
    SELECT
      var_recmode_name,
      num_recmode_id
    FROM aoms_recmode_mas
    WHERE var_recmode_flag = 'Y'
    ORDER BY num_recmode_id
  `;
  return executeQuery(sql);
}

async function getBankReceiptList() {
  const sql = `
    SELECT
      var_bankreceipt_bankname,
      num_bankreceipt_bankcode
    FROM aoms_bankreceipt_mas
    ORDER BY num_bankreceipt_orderby, var_bankreceipt_bankname
  `;
  return executeQuery(sql);
}
async function getReceiptTypes() {
  const sql = `
    SELECT
      num_receipt_receipttype,
      num_receipt_receiptid
    FROM aoms_receipt_mas
  `;
  return executeQuery(sql);
}
async function getZonesByPrabhag(prabhagId) {
  const sql = `
    SELECT
      var_zone_zonename AS zonename,
      num_zone_zoneid   AS zoneid
      from
 

aoms_zone_mas where num_zone_prabhagid = $1
order by num_zone_zoneid
  `;
  return executeQuery(sql, [prabhagId]);
}


async function getWardsByZone(zoneId) {
  const sql = `
    SELECT
      var_ward_wardname AS wardno_name,
      num_ward_wardno AS wardno
    FROM aoms_ward_mas
    WHERE num_ward_zoneid = $1
    ORDER BY num_ward_wardno
  `;
  return executeQuery(sql, [zoneId]);
}
async function getWardsByPrabhag(prabhagId) {
  const sql = `
  SELECT
      var_ward_wardname AS wardno_name,
      num_ward_wardno AS wardno,
	  num_ward_id AS wardid
    FROM aoms_ward_mas
	inner join aoms_prabhag_mas on
	num_prabhag_id = num_ward_prabhagid
    WHERE num_ward_prabhagid = $1
    ORDER BY num_ward_wardno
  `;
  return executeQuery(sql, [zoneId]);
}

async function fetchYears() {
  const sql = `
    SELECT var_year_yearname, num_year_seqno
    FROM aoms_year_mas
    ORDER BY num_year_seqno DESC
  `;
  return executeQuery(sql, []);
}

async function getAllUsers() {
  const sql = `
    select var_user_username username, var_user_userid userid from admins.aoma_user_def 
    where num_user_deptid = 7
  `;
  return executeQuery(sql, []);
}

// Get Prabhag List By User
async function getPrabhagByUser(userId) {
  const sql = `
    SELECT
      var_prabhag_name AS prabhag_name,
      num_prabhag_id   AS prabhag_id
    FROM aoms_prabhag_mas 
    WHERE num_prabhag_id IN (
      SELECT DISTINCT num_ward_prabhagid 
      FROM aoms_ward_config 
      WHERE var_ward_userid = $1
    )
    ORDER BY num_prabhag_id
  `;
  return executeQuery(sql, [userId]);
}

// Get Zones By Prabhag + User
// async function getZonesByPrabhagAndUser(prabhagId, userId) {
//   const sql = `
//     SELECT
//       var_zone_zonename AS zonename,
//       num_zone_zoneid   AS zoneid	
//     FROM aoms_zone_mas 
//     WHERE num_zone_prabhagid = $1
//       AND num_zone_zoneid IN (
//         SELECT DISTINCT num_ward_zoneid 
//         FROM aoms_ward_config 
//         WHERE num_ward_prabhagid = $1 
//           AND var_ward_userid = $2
//       )
//     ORDER BY num_zone_zoneid
//   `;
//   return executeQuery(sql, [prabhagId, userId]);
// }

async function getZonesByPrabhagAndUser(prabhagId, userId) {
  let conditions = [];
  let params = [];
  let index = 1;

  if (prabhagId) {
    conditions.push(`num_zone_prabhagid = $${index++}`);
    params.push(prabhagId);
  }

  if (userId) {
    conditions.push(`
      num_zone_zoneid IN (
        SELECT DISTINCT num_ward_zoneid
        FROM aoms_ward_config
        WHERE var_ward_userid = $${index++}
      )
    `);
    params.push(userId);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const sql = `
    SELECT
      var_zone_zonename AS zonename,
      num_zone_zoneid   AS zoneid	
    FROM aoms_zone_mas
    ${whereClause}
    ORDER BY num_zone_zoneid
  `;

  return executeQuery(sql, params);
}

// Get Wards By Zone + User
async function getWardsByZoneAndUser(zoneId, userId) {
  const sql = `
    SELECT
      var_ward_wardname AS wardno_name,
      num_ward_wardno AS wardno
    FROM aoms_ward_mas
    WHERE num_ward_zoneid = $1
      AND num_ward_wardno IN (
        SELECT DISTINCT num_ward_wardno 
        FROM aoms_ward_config 
        WHERE num_ward_zoneid = $1 
          AND var_ward_userid = $2
      )
    ORDER BY num_ward_wardno
  `;
  return executeQuery(sql, [zoneId, userId]);
}


async function getSubwardList() {
  const sql = `
    SELECT
      var_subward_name,
      num_subward_id
    FROM prop.aoms_subward_mas
    ORDER BY num_subward_id
  `;

  return executeQuery(sql);
}

module.exports = {
  getUserTypeList,
  getCollCenterList,
 getPrabhagList,
  getPrabhagById,
  getReceiptModeList,
  getBankReceiptList,
  getReceiptTypes,
  getZonesByPrabhag,
  getWardsByZone,
  getWardsByPrabhag,
  fetchYears,
  getAllUsers,
  getPrabhagByUser,
  getZonesByPrabhagAndUser,
  getWardsByZoneAndUser,
  getSubwardList
};
