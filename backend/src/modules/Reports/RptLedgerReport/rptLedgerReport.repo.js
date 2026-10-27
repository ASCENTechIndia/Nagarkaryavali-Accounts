const { executeQuery } = require("../../../db/queryExecutor");
const { AppError } = require("../../../libs/errors");

async function getTransactionDetails(transNo) {
  console.log("📤 Repo → Fetch Transaction Flow:", transNo);

  const typeSql = `
    SELECT DISTINCT trnstypeid 
    FROM transview 
    WHERE transno = :transno
  `;

  const typeResult = await executeQuery(typeSql, { transno: transNo });

  if (!typeResult.success) {
    throw new AppError(typeResult.error);
  }

  if (!typeResult.rows.length) {
    return null;
  }

  const trnstypeid = Number(typeResult.rows[0].TRNSTYPEID);

  console.log("👉 Transtype:", trnstypeid);

  let sql = "";
  let binds = { transno: transNo };

  if ([1, 2].includes(trnstypeid)) {
    sql = `
      SELECT 
        num_receiptmst_refno AS refno,
        num_receiptmst_trnstypeid AS trnstype
      FROM aoac_receiptmst_def 
      WHERE num_receiptmst_trnsno = :transno
    `;
  } 
  else if ([3, 4].includes(trnstypeid)) {
    sql = `
      SELECT 
        num_payment_refno AS refno,
        num_payment_trnstype AS trnstype
      FROM aoac_payment_def 
      WHERE num_payment_trnsno = :transno
    `;
  } 
  else if (trnstypeid === 5) {
    sql = `
      SELECT 
        num_transfermst_refno AS refno,
        num_transfermst_trnstypeid AS trnstype
      FROM aoac_transfermst_def 
      WHERE num_transfermst_trnsno = :transno
    `;
  } 
  else {
    throw new AppError("Invalid transaction type");
  }

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new AppError(result.error);
  }

  return {
    trnstypeid,
    data: result.rows,
  };
}

function parseDMY(dateStr) {
  const MONTHS = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };
  const [d, m, y] = dateStr.split("-");
  return new Date(Number(y), MONTHS[m.toUpperCase()], Number(d));
}

function parseDMY(dateStr) {
  const MONTHS = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };
  const [d, m, y] = dateStr.split("-");
  return new Date(Number(y), MONTHS[m.toUpperCase()], Number(d));
}

function computeOpeningContext(fromDate) {
  const fromObj = parseDMY(fromDate);

  const isFYBoundary =
    fromObj.getMonth() === 2 && fromObj.getDate() === 31;   

  return { isFYBoundary, prevDayStr: fromDate };
}


async function getAccountBalance(payload) {
  const { glcode, accno, ulbid, fromDate, zoneid } = payload;

  console.log("Repo → Balance Payload:", payload);

  const { isFYBoundary, prevDayStr } = computeOpeningContext(fromDate);
  console.log("prevDay:", prevDayStr, "| FY Boundary:", isFYBoundary);

  let sql = "";
  let binds = {};

  if (isFYBoundary) {
    sql = `
      SELECT NVL(SUM(openingbal), 0) AS balance
      FROM accountview_web c
      WHERE c.glcode = :glcode
        AND c.accno  = :accno
        AND c.ulbid  = :ulbid
    `;
    binds = { glcode, accno, ulbid };
  } else {
    const zoneClause = zoneid && zoneid !== "-1"
      ? " AND a.zoneid = :zoneid"
      : "";

    sql = `
      SELECT NVL(
               SUM(
                 openingbal + (
                   SELECT NVL(SUM(amount), 0)
                   FROM transview a
                   WHERE a.glcode = c.glcode
                     AND a.accno = c.accno
                     AND TRUNC(a.trnsdate) <= TO_DATE(:prevDay, 'DD-MM-YYYY')
                     AND a.ulbid = :ulbid
                     ${zoneClause}
                 )
               ), 0
             ) AS balance
      FROM accountview_web c
      WHERE c.glcode = :glcode
        AND c.accno  = :accno
        AND c.ulbid  = :ulbid
    `;
    binds = { glcode, accno, ulbid, prevDay: prevDayStr };
    if (zoneClause) binds.zoneid = zoneid;
  }

  console.log("SQL:", sql);
  console.log("Binds:", binds);

  const result = await executeQuery(sql, binds);
  if (!result.success) throw new AppError(result.error, 500);
  return result.rows[0];
}

async function getLedgerTransactions(payload) {
  const { glcode, accno, ulbid, fromDate, toDate, zoneid } = payload;

  console.log("📤 Repo → Ledger Payload:", payload);
  let sql = "";

  if(payload.ulbid == 930 || payload.ulbid == 1750) {
    sql = `
      SELECT * FROM (
      SELECT 
          TO_CHAR(TRUNC(a.trnsdate), 'DD/MM/YYYY') AS trnsdate,
          a.transno,
          CASE 
              WHEN a.sourceid = 6 THEN (
                  SELECT TO_CHAR(num_vchtransbal_vchtransbalno) 
                  FROM aoac_vchtransbal_def 
                  WHERE num_vchtransbal_transno = a.transno 
                    AND a.ulbid = num_vchtransbal_ulbid 
                    AND ROWNUM = 1
              ) 
              ELSE a.docno 
          END AS docno, a.accno,  acc.accname, var_partymst_pancard AS pancard, acc.objectcode || '-' || acc.accname || '-' || a.narration AS narration,
          TO_CHAR(a.chqno, 'FM000000') AS chqno, SUM(a.amount) AS amount, acc.functioncode AS functioncode, acc.objectcode AS objectcode 
      FROM transview a
      LEFT JOIN accountview_web acc  ON acc.glcode = a.glcode   AND acc.accno = a.accno  AND acc.ulbid = a.ulbid
      LEFT JOIN aoac_partymst_def  ON num_partymst_partyid = a.partycode
        WHERE   TRUNC(a.trnsdate) >= TO_DATE(:fromDate,'DD-MM-YYYY')
          AND TRUNC(a.trnsdate) <= TO_DATE(:toDate,'DD-MM-YYYY')
          AND a.ulbid = :ulbid 
          AND a.amount <> 0
           AND acc.glcode = :glcode
          AND acc.accno = :accno
          
          AND (:zoneid = '-1' OR a.zoneid =:zoneid)
          GROUP BY   a.trnsdate,   a.accno,     acc.accname, var_partymst_pancard, a.transno,  a.sourceid,  a.docno,  a.ulbid, 
          acc.objectcode, acc.accname, a.narration, a.chqno, acc.functioncode
union all 
SELECT 
          TO_CHAR(TRUNC(a.date_receiptmst_trnsdate), 'DD/MM/YYYY') AS trnsdate,
          a.num_receiptmst_trnsno transno,
          to_char(num_receiptmst_recno)  docno,
          acc.accno accno,
          acc.accname,
          '' AS pancard,
          acc.objectcode || '-' || acc.accname || '-' || var_receiptdesc_narration AS narration,
          '' AS chqno,
          SUM(nvl(num_receiptdesc_amount,0)) AS amount,
          acc.functioncode AS functioncode,
          acc.objectcode AS objectcode 
      FROM aoac_receiptmst_def a
      inner join aoac_receiptdesc_def on num_receiptdesc_refno=num_receiptmst_refno
      LEFT JOIN accountview_web acc  ON acc.glcode = num_receiptdesc_glcode   AND acc.accno = num_receiptdesc_accno  AND acc.ulbid = a.num_receiptmst_ulbid
         WHERE   TRUNC(a.date_receiptmst_trnsdate) >= TO_DATE(:fromDate,'DD-MM-YYYY')
          AND TRUNC(a.date_receiptmst_trnsdate) <= TO_DATE(:toDate,'DD-MM-YYYY')
          AND a.num_receiptmst_ulbid = :ulbid 
          AND nvl(num_receiptdesc_amount,0) <> 0
          and a.num_receiptmst_drgl=:glcode
          and a.num_receiptmst_dracc=:accno
          AND (:zoneid = '-1' OR a.num_receiptmst_zoneid =:zoneid)
          GROUP BY   a.date_receiptmst_trnsdate,   a.num_receiptmst_dracc,      acc.accno,acc.accname, a.num_receiptmst_trnsno,a.num_receiptmst_recno,  a.num_receiptmst_ulbid, 
          acc.objectcode, acc.accname, var_receiptdesc_narration, acc.functioncode
union all 
SELECT 
          TO_CHAR(TRUNC(a.date_receiptmst_trnsdate), 'DD/MM/YYYY') AS trnsdate,
          a.num_receiptmst_trnsno transno,
          to_char(num_receiptmst_recno)  docno,
          acc.accno accno,
          acc.accname,
          '' AS pancard,
          acc.objectcode || '-' || acc.accname || '-' || var_receiptdesc_narration AS narration,
          '' AS chqno,
          SUM(nvl(num_receiptdesc_amount,0)) AS amount,
          acc.functioncode AS functioncode,
          acc.objectcode AS objectcode 
      FROM aoac_receiptmst_def a
      inner join aoac_receiptdesc_def on num_receiptdesc_refno=num_receiptmst_refno
      LEFT JOIN accountview_web acc  ON acc.glcode = num_receiptdesc_glcode   AND acc.accno = num_receiptdesc_accno  AND acc.ulbid = a.num_receiptmst_ulbid
         WHERE   TRUNC(a.date_receiptmst_trnsdate) >= TO_DATE(:fromDate,'DD-MM-YYYY')
          AND TRUNC(a.date_receiptmst_trnsdate) <=  TO_DATE(:toDate,'DD-MM-YYYY')
          AND a.num_receiptmst_ulbid = :ulbid 
          AND nvl(num_receiptdesc_amount,0) <> 0
          and num_receiptdesc_glcode=:glcode
          and num_receiptdesc_accno=:accno
         
          AND (:zoneid = '-1' OR a.num_receiptmst_zoneid =:zoneid)
          GROUP BY   a.date_receiptmst_trnsdate,   a.num_receiptmst_dracc,      acc.accno,acc.accname, a.num_receiptmst_trnsno,a.num_receiptmst_recno,  a.num_receiptmst_ulbid, 
          acc.objectcode, acc.accname, var_receiptdesc_narration, acc.functioncode

 
    )
    ORDER BY TO_DATE(trnsdate, 'DD/MM/YYYY') ASC

    `
  } 
  else {
    sql = `
    SELECT * FROM (
      SELECT 
          TO_CHAR(TRUNC(a.trnsdate), 'DD/MM/YYYY') AS trnsdate,
          a.transno,
          CASE 
              WHEN a.sourceid = 6 THEN (
                  SELECT TO_CHAR(num_vchtransbal_vchtransbalno) 
                  FROM aoac_vchtransbal_def 
                  WHERE num_vchtransbal_transno = a.transno 
                    AND a.ulbid = num_vchtransbal_ulbid 
                    AND ROWNUM = 1
              ) 
              ELSE a.docno 
          END AS docno,
          a.accno,
          acc.accname,
          var_partymst_pancard AS pancard,
          acc.objectcode || '-' || acc.accname || '-' || a.narration AS narration,
          TO_CHAR(a.chqno, 'FM000000') AS chqno,
          SUM(a.amount) AS amount,
          acc.functioncode AS functioncode,
          acc.objectcode AS objectcode 
      FROM transview a
      LEFT JOIN accountview_web acc 
          ON acc.glcode = a.glcode 
          AND acc.accno = a.accno 
          AND acc.ulbid = a.ulbid
      LEFT JOIN aoac_partymst_def 
          ON num_partymst_partyid = a.partycode
        WHERE acc.glcode = :glcode
          AND acc.accno = :accno
          AND TRUNC(a.trnsdate) >= TO_DATE(:fromDate, 'DD-MM-YYYY')
          AND TRUNC(a.trnsdate) <= TO_DATE(:toDate, 'DD-MM-YYYY')
          AND a.ulbid = :ulbid 
          AND a.amount <> 0
          AND (:zoneid = '-1' OR a.zoneid = :zoneid)
          GROUP BY 
            a.trnsdate, 
            a.accno, 
            acc.accname,
            var_partymst_pancard,
            a.transno, 
            a.sourceid, 
            a.docno, 
            a.ulbid, 
            acc.objectcode,
            acc.accname, 
            a.narration, 
            a.chqno, 
            acc.functioncode
    )
    ORDER BY TO_DATE(trnsdate, 'DD/MM/YYYY') ASC
  `;
  }

  
  

  const binds = {
    glcode,
    accno,
    ulbid,
    fromDate,
    toDate,
    zoneid,
  };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new AppError(result.error, 500);
  }

  return result.rows;
}

module.exports = {
  getTransactionDetails,
  getAccountBalance,
  getLedgerTransactions
};