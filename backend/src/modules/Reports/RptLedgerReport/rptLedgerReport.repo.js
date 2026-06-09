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

function isFinancialYearBoundary(fromDate, toDate) {
  const [fd, fm] = fromDate.split("-");
  const [td, tm] = toDate.split("-");

  return (
    fd === "31" && fm === "03" &&
    td === "01" && tm === "04"
  );
}


async function getAccountBalance(payload) {
  const { glcode, accno, ulbid, fromDate, toDate, zoneid } = payload;

  console.log("📤 Repo → Balance Payload:", payload);

  let sql = "";
  let binds = {};

  const isFYBoundary = isFinancialYearBoundary(fromDate, toDate);

  console.log("👉 FY Boundary Check:", isFYBoundary);

  // ✅ CASE 1: Opening Balance
  if (isFYBoundary) {
    console.log("👉 Using Opening Balance Logic");

    sql = `
      SELECT NVL(SUM(openingbal), 0) AS balance
      FROM accountview_web c
      WHERE c.glcode = :glcode
        AND c.accno = :accno
        AND c.ulbid = :ulbid
    `;

    binds = {
      glcode,
      accno,
      ulbid,
    };
  } 
  // ✅ CASE 2: Running Balance
  else {
    console.log("👉 Using Running Balance Logic");

    sql = `
      SELECT NVL(
        SUM(
          openingbal + (
            SELECT NVL(SUM(amount), 0)
            FROM transview a
            WHERE a.glcode = c.glcode
              AND a.accno = c.accno
              AND TRUNC(a.trnsdate) <= TO_DATE(:toDate, 'DD-MM-YYYY')
              AND a.ulbid = :ulbid
              AND (:zoneid = '-1' OR a.zoneid = :zoneid)
          )
        ), 0
      ) AS balance
      FROM accountview_web c
      WHERE c.glcode = :glcode
        AND c.accno = :accno
        AND c.ulbid = :ulbid
    `;

    binds = {
      glcode,
      accno,
      ulbid,
      toDate,
      zoneid,
    };
  }

  console.log("📄 Final SQL:", sql);
  console.log("📦 Binds:", binds);

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new AppError(result.error, 500);
  }

  return result.rows[0];
}

async function getLedgerTransactions(payload) {
  const { glcode, accno, ulbid, fromDate, toDate, zoneid } = payload;

  console.log("📤 Repo → Ledger Payload:", payload);

  const sql = `
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

async function getLedgerJCMCTransactions(payload) {
  const { glcode, accno, ulbid, fromDate, toDate, zoneid } = payload;

  console.log("📤 Repo → Ledger Payload:", payload);

  const sql = `
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
          acc.glname,
          vz.zoneename,

          var_partymst_pancard AS pancard,

          acc.objectcode || '-' || acc.accname || '-' || a.narration AS narration,

          TO_CHAR(a.chqno, 'FM000000') AS chqno,

          SUM(a.amount) AS amount,

          MAX(NVL(rd.num_receiptdesc_amount,0)) AS discountamount,

          acc.functioncode AS functioncode,
          acc.objectcode AS objectcode

      FROM transview a

      LEFT JOIN accountview_web acc
          ON acc.glcode = a.glcode
        AND acc.accno = a.accno
        AND acc.ulbid = a.ulbid

      LEFT JOIN aoac_partymst_def
          ON num_partymst_partyid = a.partycode

      LEFT JOIN aoac_receiptmst_def rm
          ON rm.num_receiptmst_trnsno = a.transno
        AND rm.num_receiptmst_ulbid = a.ulbid

      LEFT JOIN aoac_receiptdesc_def rd
          ON rd.num_receiptdesc_refno = rm.num_receiptmst_refno

      LEFT JOIN view_zone vz
          ON vz.zoneid = a.zoneid

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
          acc.glname,
          vz.zoneename,
          var_partymst_pancard,
          a.transno,
          a.sourceid,
          a.docno,
          a.ulbid,
          acc.objectcode,
          a.narration,
          a.chqno,
          acc.functioncode
    )
    ORDER BY TO_DATE(trnsdate, 'DD/MM/YYYY') ASC
  `;

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
  getLedgerTransactions,
  getLedgerJCMCTransactions,
  
};