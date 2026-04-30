const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");

async function getRbtDepReceived(corpId, zoneId, fromDate, toDate) {
  let sql = `
    SELECT 
      num_partymst_partyid partyid, 
      var_partymst_partyname partyname, 
      var_partymst_pancard pancard, 
      var_partymst_propname propname, 
      num_secdepodet_glcode glcode,
      acc.glname, 
      acc.accname, 
      num_secdepodet_amount amount, 
      v.zoneename deptname,
      var_depositmst_deposittype deposittype, 
      num_secdeposit_depono depono, 
      num_secdeposit_bankaccno bankaccno, 
      var_secdeposit_depodetail depodetail,
      num_secdeposit_rectrnsno rectransno, 
      date_secdeposit_rectrnsdate rectransdate, 
      num_secdeposit_paytrnsno paytrnsno, 
      date_secdeposit_paytrnsdate paytrnsdate,
      functioncode functioncode 
    FROM aoac_secdeposit_def
    INNER JOIN aoac_partymst_def ON num_partymst_partyid = num_secdeposit_partyid
    INNER JOIN accountview_web acc ON acc.glcode = num_secdepodet_glcode 
      AND acc.accno = num_secdepodet_accno 
      AND acc.ulbid = num_secdepodet_ulbid
    INNER JOIN view_zone v ON v.zoneid = num_secdeposit_deptid
    LEFT OUTER JOIN aoac_deposittypemst_def ON num_depositmst_deposittypeid = num_secdeposit_depotypeid
    WHERE TRUNC(date_secdeposit_rectrnsdate) >= TO_DATE(:fromDate, 'DD-MON-YYYY')
      AND TRUNC(date_secdeposit_rectrnsdate) <= TO_DATE(:toDate, 'DD-MON-YYYY')
      AND num_secdepodet_ulbid = :corpId
  `;

  const params = {
    corpId: corpId,
    fromDate: fromDate,
    toDate: toDate
  };

  if (zoneId && zoneId !== '-1' && zoneId !== -1 && zoneId !== '') {
    sql += ` AND num_secdeposit_deptid = :zoneId`;
    params.zoneId = zoneId;
  }

  sql += ` ORDER BY num_secdeposit_rectrnsno`;

  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getRbtDepoPayment(corpId, zoneId, fromDate, toDate) {
  let sql = `
    SELECT 
      num_partymst_partyid partyid, 
      var_partymst_partyname partyname, 
      var_partymst_pancard pancard, 
      var_partymst_propname propname, 
      num_secdepodet_glcode glcode,
      acc.glname, 
      acc.accname, 
      num_secdepodet_amount amount, 
      v.zoneename deptname,
      var_depositmst_deposittype deposittype, 
      num_secdeposit_depono depono, 
      num_secdeposit_bankaccno bankaccno, 
      var_secdeposit_depodetail depodetail,
      num_secdeposit_rectrnsno rectransno, 
      date_secdeposit_rectrnsdate rectransdate, 
      num_secdeposit_paytrnsno paytrnsno, 
      date_secdeposit_paytrnsdate paytrnsdate,
      functioncode functioncode 
    FROM aoac_secdeposit_def
    INNER JOIN aoac_partymst_def ON num_partymst_partyid = num_secdeposit_partyid
    INNER JOIN accountview_web acc ON acc.glcode = num_secdepodet_glcode 
      AND acc.accno = num_secdepodet_accno 
      AND acc.ulbid = num_secdepodet_ulbid
    INNER JOIN view_zone v ON v.zoneid = num_secdeposit_deptid
    LEFT OUTER JOIN aoac_deposittypemst_def ON num_depositmst_deposittypeid = num_secdeposit_depotypeid
    WHERE TRUNC(date_secdeposit_paytrnsdate) >= TO_DATE(:fromDate, 'DD-MON-YYYY')
      AND TRUNC(date_secdeposit_paytrnsdate) <= TO_DATE(:toDate, 'DD-MON-YYYY')
      AND num_secdepodet_ulbid = :corpId
  `;

  const params = {
    corpId: corpId,
    fromDate: fromDate,
    toDate: toDate
  };

  if (zoneId && zoneId !== '-1' && zoneId !== -1 && zoneId !== '') {
    sql += ` AND num_secdeposit_deptid = :zoneId`;
    params.zoneId = zoneId;
  }

  sql += ` ORDER BY num_secdeposit_rectrnsno`;

  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getRbtUnpaid(corpId, zoneId, fromDate, toDate) {
  let sql = `
    SELECT 
      num_partymst_partyid partyid, 
      var_partymst_partyname partyname, 
      var_partymst_pancard pancard, 
      var_partymst_propname propname, 
      num_secdepodet_glcode glcode,
      acc.glname, 
      acc.accname, 
      num_secdepodet_amount amount, 
      v.zoneename deptname,
      var_depositmst_deposittype deposittype, 
      num_secdeposit_depono depono, 
      num_secdeposit_bankaccno bankaccno, 
      var_secdeposit_depodetail depodetail,
      num_secdeposit_rectrnsno rectransno, 
      date_secdeposit_rectrnsdate rectransdate, 
      num_secdeposit_paytrnsno paytrnsno, 
      date_secdeposit_paytrnsdate paytrnsdate,
      functioncode functioncode 
    FROM aoac_secdeposit_def
    INNER JOIN aoac_partymst_def ON num_partymst_partyid = num_secdeposit_partyid
    INNER JOIN accountview_web acc ON acc.glcode = num_secdepodet_glcode 
      AND acc.accno = num_secdepodet_accno 
      AND acc.ulbid = num_secdepodet_ulbid
    INNER JOIN view_zone v ON v.zoneid = num_secdeposit_deptid
    LEFT OUTER JOIN aoac_deposittypemst_def ON num_depositmst_deposittypeid = num_secdeposit_depotypeid
    WHERE (num_secdeposit_paytrnsno IS NULL 
      OR (TRUNC(date_secdeposit_paytrnsdate) > TO_DATE(:fromDate, 'DD-MON-YYYY') 
      AND TRUNC(date_secdeposit_paytrnsdate) <= TO_DATE(:toDate, 'DD-MON-YYYY')))
      AND num_secdepodet_ulbid = :corpId
  `;

  const params = {
    corpId: corpId,
    fromDate: fromDate,
    toDate: toDate
  };

  if (zoneId && zoneId !== '-1' && zoneId !== -1 && zoneId !== '') {
    sql += ` AND num_secdeposit_deptid = :zoneId`;
    params.zoneId = zoneId;
  }

  sql += ` ORDER BY num_secdeposit_rectrnsno`;

  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getRdoReport147(corpId, zoneId, fromDate, toDate) {
  let sql = `
    SELECT 
      rectransdate, 
      partyname, 
      depodetail, 
      rectransno, 
      amount, 
      deptname, 
      deposittype, 
      glcode, 
      accno, 
      depono, 
      transno, 
      narration, 
      recno,
      apr, may, jun, jul, aug, sep, oct, nov, decm, jan, feb, mar, 
      NVL(apr,0) + NVL(may,0) + NVL(jun,0) + NVL(jul,0) + NVL(aug,0) + NVL(sep,0) + 
      NVL(oct,0) + NVL(nov,0) + NVL(decm,0) + NVL(jan,0) + NVL(feb,0) + NVL(mar,0) total,
      trnsapr, trnsmay, trnsjun, trnsjul, trnsaug, trnssep, trnsoct, trnsnov, trnsdecm, trnsjan, trnsfeb, trnsmar, 
      0 Paytransno, 
      depodetails, 
      sddt,
      partyid, 
      certino
    FROM (
      SELECT 
        TO_CHAR(date_secdeposit_rectrnsdate,'dd/MM/yyyy') rectransdate, 
        var_partymst_partyname partyname, 
        var_secdeposit_depodetail depodetail,
        num_secdeposit_rectrnsno rectransno, 
        num_secdepodet_amount amount, 
        v.zoneename deptname,
        var_depositmst_deposittype deposittype, 
        num_secdepodet_glcode glcode, 
        num_secdepodet_accno accno, 
        num_secdeposit_depono depono, 
        num_secdeposit_rectrnsno transno,
        (SELECT num_transdet_narration 
         FROM aoac_transdet_def 
         WHERE num_transdet_transno = num_secdeposit_paytrnsno 
           AND num_transdet_amount > 0
           AND num_transdet_ulbid = :corpId 
           AND ROWNUM = 1) narration,
        CASE 
          WHEN num_secdeposit_recno IS NULL THEN num_secdeposit_vchno 
          ELSE num_secdeposit_recno 
        END recno,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 4 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS apr,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 5 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS may,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 6 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS jun,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 7 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS jul,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 8 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS aug,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 9 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS sep,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 10 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS oct,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 11 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS nov,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 12 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS decm,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 1 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS jan,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 2 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS feb,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 3 THEN NVL(num_sdrefund_amount, 0) ELSE 0 END) AS mar,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 4 THEN num_sdrefund_transno ELSE NULL END) AS trnsapr,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 5 THEN num_sdrefund_transno ELSE NULL END) AS trnsmay,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 6 THEN num_sdrefund_transno ELSE NULL END) AS trnsjun,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 7 THEN num_sdrefund_transno ELSE NULL END) AS trnsjul,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 8 THEN num_sdrefund_transno ELSE NULL END) AS trnsaug,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 9 THEN num_sdrefund_transno ELSE NULL END) AS trnssep,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 10 THEN num_sdrefund_transno ELSE NULL END) AS trnsoct,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 11 THEN num_sdrefund_transno ELSE NULL END) AS trnsnov,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 12 THEN num_sdrefund_transno ELSE NULL END) AS trnsdecm,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 1 THEN num_sdrefund_transno ELSE NULL END) AS trnsjan,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 2 THEN num_sdrefund_transno ELSE NULL END) AS trnsfeb,
        SUM(CASE WHEN EXTRACT(MONTH FROM dat_sdrefund_transdt) = 3 THEN num_sdrefund_transno ELSE NULL END) AS trnsmar,
        var_secdeposit_depodetail depodetails, 
        TO_CHAR(date_secdeposit_paytrnsdate,'dd/MM/yyyy') sddt, 
        num_partymst_partyid partyid, 
        num_sdrefund_vchgenno certino
      FROM aoac_secdeposit_def
      LEFT JOIN aoac_sdrefund_def ON num_secdeposit_id = num_sdrefund_sdid 
        AND var_sdrefund_Flag IN ('V','O') 
        AND num_sdrefund_ulbid = num_secdepodet_ulbid
        AND num_secdeposit_partyid = num_sdrefund_partyid
      INNER JOIN aoac_partymst_def ON num_partymst_partyid = num_secdeposit_partyid 
        AND num_partymst_ulbid = num_secdepodet_ulbid
      INNER JOIN view_zone v ON v.zoneid = num_secdeposit_deptid
      LEFT OUTER JOIN aoac_deposittypemst_def ON num_depositmst_deposittypeid = num_secdeposit_depotypeid 
        AND num_depositmst_ulbid = num_secdepodet_ulbid
      WHERE TRUNC(date_secdeposit_rectrnsdate) BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY') AND TO_DATE(:toDate, 'DD-MON-YYYY')
        AND num_secdepodet_ulbid = :corpId
  `;

  const params = {
    corpId: corpId,
    fromDate: fromDate,
    toDate: toDate
  };

  if (zoneId && zoneId !== '-1' && zoneId !== -1 && zoneId !== '') {
    sql += ` AND num_secdeposit_deptid = :zoneId`;
    params.zoneId = zoneId;
  }

  sql += `
      GROUP BY date_secdeposit_rectrnsdate, var_partymst_partyname, var_secdeposit_depodetail, num_secdeposit_rectrnsno,
        num_secdepodet_amount, v.zoneename, var_depositmst_deposittype, num_secdepodet_glcode, num_secdepodet_accno,
        num_secdeposit_depono, num_secdeposit_rectrnsno, var_secdeposit_narration, num_secdeposit_recno, num_secdeposit_vchno, 
        date_secdeposit_paytrnsdate, num_partymst_partyid, var_sdrefund_certino, num_secdeposit_paytrnsno, num_sdrefund_vchgenno
    )
    ORDER BY TO_DATE(rectransdate, 'dd/MM/yyyy'), partyid
  `;

  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

module.exports = {
  getRbtDepReceived,
  getRbtDepoPayment,
  getRbtUnpaid,
  getRdoReport147
};