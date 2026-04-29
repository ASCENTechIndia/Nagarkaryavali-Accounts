const { executeQuery } = require("../../../db/queryExecutor");

const getChequeBookData = async ({
  majorCode,
  bankAcc,
  chequeFrom,
  chequeTo,
  zoneId,
  grampanchId,
}) => {
  let query = `
    SELECT 
      cd.num_chequebook_chqno AS chqno,
      cd.num_chequebook_trnsno AS trnsno,
      cd.date_chequebook_trnsdate AS trnsdate,

      CASE 
        WHEN num_cheuebook_cancelupdateflag='N' 
        THEN 'Cancel Cheque /रद्द  धनादेश'
        ELSE var_trnstype_trnstype 
      END AS trnstype,

      var_partymst_partyname AS partyname,
      a.docno,
      a.chqdate,
      a.narration,
      vz.zoneename AS zone,

      CASE 
        WHEN a.amount >= 0 THEN a.amount 
        ELSE a.amount * -1 
      END AS amount,

      CASE 
        WHEN a.amount >= 0 THEN 'Cr.' 
        WHEN a.amount IS NULL THEN NULL 
        ELSE 'Dr.' 
      END AS crdr,

      a.glcode,
      acc.glname,
      a.accno,
      acc.accname,
      num_chequebook_bookno AS chqbookno,
      acc.functioncode,
      acc.objectcode

    FROM aoac_chequebookdet_def cd

    LEFT JOIN transview a 
      ON num_chequebook_trnsno = a.transno 
      AND a.amount < 0

    INNER JOIN aoac_chequebook_def cm 
      ON cm.num_chequebook_seqno = cd.num_chequebook_seqno
      AND cd.num_chequebook_bankglcode = cm.num_chequebook_bankglcode
      AND cm.num_chequebook_bankaccno = cd.num_chequebook_bankaccno

    LEFT JOIN aoac_trnstype_def 
      ON num_trnstype_trnstypeid = a.trnstypeid

    LEFT JOIN aoac_partymst_def 
      ON num_partymst_partyid = a.partycode

    LEFT JOIN view_zone vz 
      ON vz.zoneid = a.zoneid

    LEFT JOIN accountview_web acc 
      ON acc.glcode = a.glcode 
      AND acc.accno = a.accno 
      AND acc.ulbid = cd.num_chequebook_ulbid

    WHERE 
      cd.num_chequebook_bankglcode = :majorCode
      AND cd.num_chequebook_bankaccno = :bankAcc
  `;

  const params = { majorCode, bankAcc };

  if (chequeFrom && chequeTo) {
    query += `
      AND num_chequebook_chqno BETWEEN :chequeFrom AND :chequeTo
    `;
    params.chequeFrom = chequeFrom;
    params.chequeTo = chequeTo;
  }

  if (zoneId && zoneId !== "-1") {
    query += ` AND num_chequebook_zoneid = :zoneId `;
    params.zoneId = zoneId;
  }

  if (grampanchId && grampanchId !== "0") {
    query += ` AND a.grampanchid = :grampanchId `;
    params.grampanchId = grampanchId;
  }

  query += ` ORDER BY num_chequebook_chqno`;

  const result = await executeQuery(query, params);

  if (!result.success) throw new Error(result.error);

  return result.rows;
};

module.exports = {
  getChequeBookData,
};