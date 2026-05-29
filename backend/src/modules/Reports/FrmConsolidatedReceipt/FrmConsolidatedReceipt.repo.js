const { executeQuery } = require("../../../db/queryExecutor");

async function getConsolidatedReceiptRepo(payload) {
  console.log("📤 Repo: Fetch Consolidated Receipt", payload);

  const { fromDate, toDate, ulbId, paymentTypeId, zoneId, deptId, collectionCenterId, reportType } = payload;

  let sql = "";

  if (reportType === "1") {
    sql = `
      SELECT 
          t.num_depttrns_deptid AS vibhagid,
          TRUNC(a.dat_accrec_insdate) AS recdate,
          d.deptname AS department,
          d.deptid AS deptid,
          b.accname AS accdescription,
          b.accno AS accounthead,
          COUNT(t.num_depttrns_transid) AS nooftransaction,
          t.num_depttrns_ulbid AS ulbid,

          SUM(CASE 
              WHEN t.num_depttrns_paymodeid IN (188,0,1)
              THEN x.amount ELSE 0 END) AS cashamt,

          SUM(CASE 
              WHEN t.num_depttrns_paymodeid IN (189,253,191,2,3)
              THEN x.amount ELSE 0 END) AS chequeamt,

          SUM(CASE 
              WHEN t.num_depttrns_paymodeid IN (21,187,41)
              THEN x.amount ELSE 0 END) AS bankamt,

          SUM(CASE 
              WHEN t.num_depttrns_paymodeid IN (207, 4)
              THEN x.amount ELSE 0 END) AS onlineamt,

          SUM(
              CASE WHEN t.num_depttrns_paymodeid IN (188,0,1)
              THEN x.amount ELSE 0 END
          ) +
          SUM(
              CASE WHEN t.num_depttrns_paymodeid IN (189,253,191,2,3)
              THEN x.amount ELSE 0 END
          ) +
          SUM(
              CASE WHEN t.num_depttrns_paymodeid IN (21,187,41)
              THEN x.amount ELSE 0 END
          ) +
          SUM(
              CASE WHEN t.num_depttrns_paymodeid IN (207, 4)
              THEN x.amount ELSE 0 END
          ) AS total

      FROM aoac_depttrans_mas t

      INNER JOIN aoac_accrec_mas a
          ON a.num_accrec_challano = t.var_depttrns_chalanno
          AND a.num_accrec_recno = t.var_depttrns_receiptno
          AND a.num_accrec_ulbid = t.num_depttrns_ulbid

      INNER JOIN vw_accdeptconfig d
          ON d.deptid = t.num_depttrns_deptid
          AND d.ulbid = t.num_depttrns_ulbid

      INNER JOIN (
          SELECT 
              SUM(dt.num_depttrnsdet_amountcr) AS amount,
              dt.num_depttrnsdet_transid AS transno,
              dt.num_depttrnsdet_majorcode AS glcode,
              dt.num_depttrnsdet_minorcode AS accno
          FROM aoac_depttrans_det dt
          GROUP BY 
              dt.num_depttrnsdet_transid,
              dt.num_depttrnsdet_majorcode,
              dt.num_depttrnsdet_minorcode
      ) x ON x.transno = t.num_depttrns_transid

      INNER JOIN accountview_web b
          ON b.glcode = x.glcode
          AND b.accno = x.glcode || x.accno
          AND b.ulbid = t.num_depttrns_ulbid

      WHERE t.num_depttrns_ulbid = :ulbId
      AND TRUNC(a.dat_accrec_recdate)
      BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
      AND TO_DATE(:toDate,'DD-MM-YYYY')
    `;
  } else {
    sql = `
      SELECT 
          t.num_depttrns_deptid AS vibhagid,
          d.deptname AS department,
          d.deptid AS deptid,
          b.accname AS accdescription,
          b.accno AS accounthead,
          COUNT(t.num_depttrns_transid) AS nooftransaction,
          t.num_depttrns_ulbid AS ulbid,

          SUM(CASE 
              WHEN t.num_depttrns_paymodeid IN (188,0,1)
              THEN x.amount ELSE 0 END) AS cashamt,

          SUM(CASE 
              WHEN t.num_depttrns_paymodeid IN (189,253,191,2,3)
              THEN x.amount ELSE 0 END) AS chequeamt,

          SUM(CASE 
              WHEN t.num_depttrns_paymodeid IN (21,187,41)
              THEN x.amount ELSE 0 END) AS bankamt,

          SUM(CASE 
              WHEN t.num_depttrns_paymodeid  IN (207, 4)
              THEN x.amount ELSE 0 END) AS onlineamt,

          SUM(
              CASE WHEN t.num_depttrns_paymodeid IN (188,0,1)
              THEN x.amount ELSE 0 END
          ) +
          SUM(
              CASE WHEN t.num_depttrns_paymodeid IN (189,253,191,2,3) 
              THEN x.amount ELSE 0 END
          ) +
          SUM(
              CASE WHEN t.num_depttrns_paymodeid IN (21,187,41)
              THEN x.amount ELSE 0 END
          ) +
          SUM(
              CASE WHEN t.num_depttrns_paymodeid IN (207, 4)
              THEN x.amount ELSE 0 END
          ) AS total

      FROM aoac_depttrans_mas t

      INNER JOIN aoac_accrec_mas a
          ON a.num_accrec_challano = t.var_depttrns_chalanno
          AND a.num_accrec_recno = t.var_depttrns_receiptno
          AND a.num_accrec_ulbid = t.num_depttrns_ulbid

      INNER JOIN vw_accdeptconfig d
          ON d.deptid = t.num_depttrns_deptid
          AND d.ulbid = t.num_depttrns_ulbid

      INNER JOIN (
          SELECT 
              SUM(dt.num_depttrnsdet_amountcr) AS amount,
              dt.num_depttrnsdet_transid AS transno,
              dt.num_depttrnsdet_majorcode AS glcode,
              dt.num_depttrnsdet_minorcode AS accno
          FROM aoac_depttrans_det dt
          GROUP BY 
              dt.num_depttrnsdet_transid,
              dt.num_depttrnsdet_majorcode,
              dt.num_depttrnsdet_minorcode
      ) x ON x.transno = t.num_depttrns_transid

      INNER JOIN accountview_web b
          ON b.glcode = x.glcode
          AND b.accno = x.glcode || x.accno
          AND b.ulbid = t.num_depttrns_ulbid

      WHERE t.num_depttrns_ulbid = :ulbId
      AND TRUNC(a.dat_accrec_recdate)
      BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
      AND TO_DATE(:toDate,'DD-MM-YYYY')
    `;
  }
  const binds = {
    fromDate,
    toDate,
    ulbId,
  };

  if (paymentTypeId) {
    sql += ` AND t.num_depttrns_paymodeid = :paymentTypeId `;
    binds.paymentTypeId = paymentTypeId;
  }

  if (zoneId) {
    sql += ` AND t.num_depttrns_zoneid = :zoneId `;
    binds.zoneId = zoneId;
  }

  if (deptId) {
    sql += ` AND t.num_depttrns_deptid = :deptId `;
    binds.deptId = deptId;
  }

  if (collectionCenterId) {
    sql += ` AND a.num_accrec_collectionid = :collectionCenterId `;
    binds.collectionCenterId = collectionCenterId;
  }

  if (reportType === "1") {
    sql += `
      GROUP BY
          t.num_depttrns_deptid,
          TRUNC(a.dat_accrec_insdate),
          d.deptname,
          d.deptid,
          b.accname,
          b.accno,
          t.num_depttrns_ulbid
      ORDER BY d.deptname
    `;
  } else {
    sql += `
      GROUP BY
          t.num_depttrns_deptid,
          d.deptname,
          d.deptid,
          b.accname,
          b.accno,
          t.num_depttrns_ulbid
      ORDER BY d.deptname
    `;
  }

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


async function getPaymentTypes() {
  console.log("📤 Repo: Fetch Payment Types");

  const sql = `
    SELECT 
      recmodname,
      recmodeid
    FROM Prop.vw_recmodeconfig
    WHERE recmodeid IS NOT NULL
    GROUP BY recmodname, recmodeid
    ORDER BY recmodname
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}
module.exports = {
  getConsolidatedReceiptRepo,
  getPaymentTypes
};
