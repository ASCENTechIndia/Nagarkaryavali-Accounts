const { executeQuery } = require("../../../db/queryExecutor");

async function getPartySearch1Repo(params) {
  const query = `
    SELECT 
      num_partymst_partyid || '-' || var_partymst_partyname AS partyname,
      num_partymst_partyid AS partyid
    FROM aoac_partymst_def
    WHERE (
      UPPER(var_partymst_partyname) LIKE UPPER('%' || :searchText || '%')
      OR TO_CHAR(num_partymst_partyid) LIKE '%' || :searchText || '%'
    )
    AND num_partymst_ulbid = :ulbid
  `;
  return await executeQuery(query, params);
}

async function getPartySearch2Repo(params) {
  const query = `
    SELECT 
      var_partymst_partyname AS partyname,
      num_partymst_partyid AS partyid
    FROM aoac_partymst_def
    WHERE 
      UPPER(var_partymst_partyname) LIKE UPPER('%' || :searchText || '%')
      OR TO_CHAR(num_partymst_partyid) LIKE :searchText || '%'
    AND num_partymst_ulbid = :ulbid
    ORDER BY var_partymst_partyname
  `;
  return await executeQuery(query, params);
}

async function getSDReceivedPaidRepo(params) {
  const query = `
    SELECT 
      TO_CHAR(rectrnsdate,'dd/MM/yyyy') AS rectrnsdate,
      recno,
      partyid,
      partyname,
      nidhiname,
      certino,
      TO_CHAR(sddt,'dd/MM/yyyy') AS sddt,
      amount,
      accname
    FROM vw_sdreceivedpaid
    WHERE ulbid = :ulbid
      AND (:recno IS NULL OR recno = :recno)
      AND (:certino IS NULL OR certino = :certino)
      AND (:partyname IS NULL OR partyname = :partyname)
      AND (:partyid IS NULL OR partyid = :partyid)
      AND TRUNC(sddt) BETWEEN TO_DATE(:fromDate,'DD-MON-YYYY') AND TO_DATE(:toDate,'DD-MON-YYYY')
  `;
  return await executeQuery(query, params);
}

module.exports = {
  getPartySearch1Repo,
  getPartySearch2Repo,
  getSDReceivedPaidRepo,
};
