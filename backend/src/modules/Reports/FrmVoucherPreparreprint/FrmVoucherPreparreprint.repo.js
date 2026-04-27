const { executeQuery } = require("../../../db/queryExecutor");

// ================= LIST =================
const getVoucherPrepareReprintList = async ({ fromDate, toDate, corp_id, partyId }) => {
  let query = `
    SELECT 
      refno,
      partyid,
      partyname,
      zoneename,
      zoneid,
      transdate,
      amt - SUM(cramt) AS amt
    FROM vw_vchpreprecdtls
    WHERE TRUNC(transdate) BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY') 
                               AND TO_DATE(:toDate,'DD-MM-YYYY')
      AND ulbid = :corp_id
  `;

  const params = { fromDate, toDate, corp_id };

  if (partyId) {
    query += ` AND (partyid = :partyId OR partyname = :partyId)`;
    params.partyId = partyId;
  }

  query += `
    GROUP BY refno, partyid, partyname, zoneename, zoneid, amt, transdate
    ORDER BY refno, transdate
  `;

  const result = await executeQuery(query, params);

  if (!result.success) throw new Error(result.error);

  return result.rows;
};

// ================= DETAILS =================
const getVoucherPrepareReprintDetails = async ({ refNo, corp_id }) => {
  const query = `
    SELECT 
      REFNO,
      PARTYID,
      PARTYNAME,
      PANCARD,
      ZONEENAME,
      ZONEID,
      DRGLCODE,
      DRACCNO,
      AMT,
      USERNAME,
      DRGLNAME,
      DRACNAME,
      CRGLCODE,
      CRGLACC,
      CRGLNAME,
      CRACNAME,
      CRAMT,
      NARRATION,
      DEPTNAME,
      ULBID,
      VHRNO,
      transdate
    FROM vw_vchpreprecdtls
    WHERE REFNO = :refNo
      AND ULBID = :corp_id
  `;

  const result = await executeQuery(query, { refNo, corp_id });

  if (!result.success) throw new Error(result.error);

  return result.rows;
};

module.exports = {
  getVoucherPrepareReprintList,
  getVoucherPrepareReprintDetails,
};