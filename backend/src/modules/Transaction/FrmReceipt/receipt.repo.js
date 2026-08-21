const oracledb = require("oracledb");
const { withTx } = require("../../../db/tx");
const { executeQuery } = require("../../../db/queryExecutor");

// ✅ 1. Get Receipt List
const getReceiptListRepo = (ddl_ZoneID, ddl_ULB_ID, ddl_USER_ID) =>
  executeQuery(
    `SELECT
    rmst.num_receiptmst_refno AS refno,
    rmst.date_receiptmst_trnsdate AS trnsdate,
    rmst.num_receiptmst_recno AS docno,
    tt.var_trnstype_trnstypemar AS trnstype,
    vz.zoneename AS zonename,
    gp.var_grampanch_grampanch AS grampanch,

    NVL(det.total_amount, 0) - NVL(rdesc.discount_amount, 0) AS amount,

    rmst.var_receiptmst_insby AS username,
    rmst.date_receiptmst_insdate AS datetime,
    rmst.num_receiptmst_trnstypeid AS trnstypeid,

    0 AS BudgetCode,

    NVL(rdesc.discount_amount, 0) AS discountamount

FROM aoac_receiptmst_def rmst

/* Aggregate receipt details */
LEFT JOIN (
    SELECT
        num_receiptdet_refno,
        SUM(num_receiptdet_amount) AS total_amount
    FROM aoac_receiptdet_def
    GROUP BY num_receiptdet_refno
) det
    ON det.num_receiptdet_refno = rmst.num_receiptmst_refno

INNER JOIN aoac_trnstype_def tt
    ON tt.num_trnstype_trnstypeid = rmst.num_receiptmst_trnstypeid

INNER JOIN view_zone vz
    ON vz.zoneid = rmst.num_receiptmst_zoneid

LEFT JOIN aoac_grampanch_def gp
    ON gp.num_grampanch_deptid = rmst.num_receiptmst_zoneid
   AND gp.num_grampanch_grampanchid = rmst.num_receiptmst_grampanchid

/* Aggregate discounts */
LEFT JOIN (
    SELECT
        num_receiptdesc_refno,
        SUM(num_receiptdesc_amount) AS discount_amount
    FROM aoac_receiptdesc_def
    GROUP BY num_receiptdesc_refno
) rdesc
    ON rdesc.num_receiptdesc_refno = rmst.num_receiptmst_refno

WHERE rmst.var_receiptmst_authstatus IS NULL
  AND vz.zoneid = :ddl_ZoneID
  AND rmst.num_receiptmst_ulbid = :ddl_ULB_ID
  AND rmst.var_receiptmst_insby = :ddl_USER_ID

ORDER BY rmst.num_receiptmst_refno`,
    { ddl_ZoneID, ddl_ULB_ID, ddl_USER_ID },
  );

// ✅ 2. Get Zones
const getZonesRepo = (corp_id) =>
  executeQuery(
    `SELECT zoneename, zoneid 
     FROM view_zone 
     WHERE corpid = :corp_id`,
    { corp_id },
  );

// ✅ 3. Get Corporation
const getCorporationRepo = (corp_id) =>
  executeQuery(
    `SELECT var_corporation_name CorporationName,
            num_corporation_id CorporationID
     FROM admins.aoma_corporation_mas
     WHERE num_corporation_id = :corp_id`,
    { corp_id },
  );

// ✅ 4. Get Departments
const getDepartmentsRepo = (ulbid) =>
  executeQuery(
    `SELECT deptname, deptid 
     FROM vw_accdeptconfig 
     WHERE ulbid = :ulbid`,
    { ulbid },
  );

// ✅ 5. Get Narration
const getNarrationRepo = () =>
  executeQuery(
    `SELECT var_narration_remark
     FROM aoac_narration_mst
     WHERE var_narration_type = 'R'
     ORDER BY var_narration_type`,
    {},
  );

// ✅ 6. Get Transaction Type
const getTransTypeRepo = () =>
  executeQuery(
    `SELECT var_trnstype_trnstype DisplayText,
            num_trnstype_trnstypeid ValueField
     FROM aoac_trnstype_def
     WHERE num_trnstype_trnstypeid IN (1,2)`,
    {},
  );

// ✅ 7. Get Receipt Details
const getReceiptDetailsRepo = (RefNo) =>
  executeQuery(
    `SELECT 
        0 AS count,
        a.date_receiptmst_trnsdate AS trnsdate, 
        a.num_receiptmst_recno AS recno, 
        a.num_receiptmst_trnstypeid AS trnstypeid, 
        a.num_receiptmst_zoneid AS zoneid,
        a.num_receiptmst_grampanchid AS grampanchid, 
        accdr.functioncode AS drgl, 
        accdr.glname AS drglname, 
        accdr.objectcode AS dracc, 
        accdr.accname AS draccname,
        acc.functioncode AS GLCode, 
        acc.glname AS GLName, 
        acc.objectcode AS AccNo, 
        acc.accname AS AccountName, 
        c.num_receiptdet_amount AS Credit,
        c.var_receiptdet_narration AS Narration, 
        c.num_receiptdet_partycode AS Party,
        acc.accsubtypeid, 
        NVL(a.num_receiptmst_deptid, 1) AS accdeptid,
        a.num_receiptmst_budget_id AS budget_id,
        a.num_receiptmst_nidhi_id AS nidhi_id,
        a.num_receiptmst_subdeptid AS subdeptid,
            c.num_receiptdet_arramount,
        c.num_receiptdet_curramount

     FROM aoac_receiptmst_def a
     INNER JOIN aoac_receiptdet_def c 
        ON a.num_receiptmst_refno = c.num_receiptdet_refno
     LEFT  JOIN accountview_web accdr 
        ON a.num_receiptmst_drgl = accdr.glcode 
       AND a.num_receiptmst_dracc = accdr.accno  
       AND a.num_receiptmst_ulbid = accdr.ulbid
     LEFT  JOIN accountview_web acc 
        ON c.num_receiptdet_glcode = acc.glcode 
       AND c.num_receiptdet_accno = acc.accno 
       AND a.num_receiptmst_ulbid = acc.ulbid
     WHERE a.num_receiptmst_refno = :RefNo`,
    { RefNo },
  );

// ✅ 8. Get Party
const getPartyRepo = (ulbid) =>
  executeQuery(
    `SELECT num_partymst_partyid||'-'||var_partymst_partyname partyname,
            num_partymst_partyid
     FROM aoac_partymst_def
     WHERE num_partymst_ulbid = :ulbid
     ORDER BY num_partymst_partyid`,
    { ulbid },
  );

// ✅ 9. Search GL
const searchGLRepo = () =>
  executeQuery(
    `SELECT DISTINCT 
        var_accmst_function || '-' || var_glmaster_glname AS glname,
        var_accmst_function AS glcode
     FROM aoac_glmaster_def
     INNER JOIN aoac_accmaster_def
       ON var_accmst_function = num_glmaster_glcode
      AND num_accmaster_accsubtype IN (4820, 4822, 4821, 4823, 4810)`,
    {},
  );

const searchGLALLRepo = () =>
  executeQuery(
    `select distinct glcode, glsearchname, glfunction 
        from view_glweb`,
    {},
  );

// ✅ 10. Insert / Update Receipt (TRANSACTION)
const receiptInsertUpdateRepo = (data) =>
  withTx(async (connection) => {
    const result = await connection.execute(
      `BEGIN 
          aoac_receipt_ins(
            :In_UserId,
            :In_ParamStr,
            :In_ParamStr2,
            :In_ParamStr3,
            :In_ParamStr4,
            :In_ParamStr5,
            :In_ParamStr6,
           
          
            
            :out_ReturnStr,
            :out_ErrorCode,
            :out_ErrorMsg
          );
       END;`,
      {
        ...data,

        out_ReturnStr: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 500,
        },
        out_ErrorCode: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER,
        },
        out_ErrorMsg: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 2000,
        },
      },
    );

    console.log("Result: ", result);

    return {
      refNo: result.outBinds.out_ReturnStr,
      errorCode: result.outBinds.out_ErrorCode,
      message: result.outBinds.out_ErrorMsg,
    };
  });

const getBudgetHeadsRepo = () =>
  executeQuery(`select var_budgetconfig_budgetname,
                        num_budgetconfig_headid
                from aoac_budgetconfig_det
                where num_budgetconfig_level=1`);

const getReceiptDetailsPdfRepo = (refno, ulbid) =>
  executeQuery(
    `SELECT
    vr.*,
    (
        SELECT SUM(rd.num_receiptdesc_amount)
        FROM aoac_receiptdesc_def rd
        WHERE rd.num_receiptdesc_refno = vr.REFNO
    ) AS DISCOUNTAMOUNT,
    d.num_accmpdet_id,
    (
        SELECT vd.deptname
        FROM aoac_receiptmst_def ad
        LEFT JOIN vw_accdeptconfig vd ON vd.deptid = ad.num_receiptmst_deptid
        WHERE ad.num_receiptmst_refno = vr.refno
        AND ROWNUM = 1
    ) AS deptname
FROM VW_Receiptdetails vr
INNER JOIN
(
    SELECT
        var_accmpdet_accno,
        MIN(num_accmpdet_id) AS num_accmpdet_id
    FROM aoms_accusermap_det
    GROUP BY var_accmpdet_accno
) d
    ON d.var_accmpdet_accno = vr.taxac
     WHERE vr.REFNO = :refno
       AND vr.ulbid = :ulbid
    ORDER BY d.num_accmpdet_id`,
    { refno, ulbid },
  );
  // executeQuery(
  //   `SELECT
  //       vr.*,
  //       (
  //           SELECT SUM(rd.num_receiptdesc_amount)
  //           FROM aoac_receiptdesc_def rd
  //           WHERE rd.num_receiptdesc_refno = vr.REFNO
  //       ) AS DISCOUNTAMOUNT,
  //       d.num_accmpdet_id
  //   FROM VW_Receiptdetails vr
  //   INNER JOIN
  //   (
  //       SELECT
  //           var_accmpdet_accno,
  //           MIN(num_accmpdet_id) AS num_accmpdet_id
  //       FROM aoms_accusermap_det
  //       GROUP BY var_accmpdet_accno
  //   ) d
  //       ON d.var_accmpdet_accno = vr.taxac
  //    WHERE vr.REFNO = :refno
  //      AND vr.ulbid = :ulbid
  //   ORDER BY d.num_accmpdet_id`,
  //   { refno, ulbid },
  // );

async function getReceiptPDF(payload) {
  try {
    let query = `
      SELECT
        v.REFNO,
        r.num_receiptmst_trnsno AS TRNSNO,
        r.num_receiptmst_deptid AS DEPTID,
        MIN(v.TRANSDATE) AS TRANSDATE,
        v.TRANSTYPE,
        v.ZONEENAME,
        v.ACCNAME,
        v.ACCCNO,
        v.PARTYNAME,
        v.ULBID,
        v.PARTYCODE,
        SUM(v.AMOUNT) AS TOTAL_AMOUNT,
        (
            SELECT SUM(rd.num_receiptdesc_amount)
            FROM aoac_receiptdesc_def rd
            WHERE rd.num_receiptdesc_refno = v.REFNO
        ) AS DISCOUNTAMOUNT
      FROM VW_Receiptdetails v
      INNER JOIN aoac_receiptmst_def r
        ON r.num_receiptmst_refno = v.REFNO
       AND r.num_receiptmst_ulbid = v.ULBID
      WHERE v.ULBID = :ulbid
        AND TRUNC(v.TRANSDATE)
            BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY')
                AND TO_DATE(:toDate,'DD-MM-YYYY')
    `;

    let bindParams = {
      ulbid: payload.ulbid,
      fromDate: payload.fromDate,
      toDate: payload.toDate
    };

    const hasDept =
      payload.deptid &&
      payload.deptid !== "-1" &&
      payload.deptid !== "" &&
      payload.deptid !== null &&
      payload.deptid !== undefined;

    if (hasDept) {
      query += ` AND r.num_receiptmst_deptid = :deptid`;
      bindParams.deptid = payload.deptid;
    }

    query += `
      GROUP BY
        v.REFNO,
        r.num_receiptmst_trnsno,
        r.num_receiptmst_deptid,
        v.TRANSTYPE,
        v.ZONEENAME,
        v.ACCNAME,
        v.ACCCNO,
        v.PARTYNAME,
        v.ULBID,
        v.PARTYCODE
      ORDER BY v.REFNO DESC
    `;

    const result = await executeQuery(query, bindParams);
    return result.rows;

  } catch (err) {
    throw err;
  }
}


async function getUserMapHeaderRepo(payload) {

  try {

    const query = `
      SELECT
          num_accusermap_ward,
          num_accusermap_transtypeid,
          var_accusermap_recno,
          var_accusermap_glcode,
          var_accusermap_accno,
          num_accusermap_deptid,
          var_accusermap_remark
      FROM aoms_accusermap_mas
      WHERE num_accusermap_userid = :userId
    `;

    const result = await executeQuery(
      query,
      {
        userId: payload.userId
      }
    );

    return result.rows;

  } catch (err) {
    throw err;
  }
}

// ======================================================
// USER MAP MASTER + DETAIL
// ======================================================

async function getUserMapDetailsRepo(payload) {

  try {

    const query = `
      SELECT *
      FROM aoms_accusermap_mas
      INNER JOIN aoms_accusermap_det
        ON num_accusermap_id = num_accmpdet_mainid
      WHERE num_accusermap_userid = :userId
      ORDER BY num_accmpdet_id ASC

    `;

    const result = await executeQuery(
      query,
      {
        userId: payload.userId
      }
    );

    return result.rows;

  } catch (err) {
    throw err;
  }
}



async function getAccountMappingDetailRepo(payload) {

  try {

    const query = `
      SELECT
          d.var_accmpdet_glcode,
          d.var_accmpdet_glname,
          d.var_accmpdet_accno,
          d.var_accmpdet_accnoname,
          d.var_accmpdet_insby,
          d.dat_accmpdet_insdate
      FROM aoms_accusermap_mas m
      INNER JOIN aoms_accusermap_det d
        ON m.num_accusermap_id = d.num_accmpdet_mainid
      WHERE m.num_accusermap_userid = :userId
      ORDER BY
    CASE
        WHEN d.var_accmpdet_accno = '91028290003' THEN 999
        ELSE d.num_accmpdet_id
    END
    `;

    const result = await executeQuery(
      query,
      {
        userId: payload.userId
      }
    );

    return result.rows;

  } catch (err) {
    throw err;
  }
}

const getReceiptDetailByRefNo = async (params) => {
  try {

    const query = `
      SELECT *
      FROM (
          SELECT
              0 AS count,
              a.date_receiptmst_trnsdate AS trnsdate,
              a.num_receiptmst_recno AS recno,
              a.num_receiptmst_trnstypeid AS trnstypeid,
              a.num_receiptmst_zoneid AS zoneid,
              a.num_receiptmst_grampanchid AS grampanchid,
              accdr.functioncode AS drgl,
              accdr.glname AS drglname,
              accdr.objectcode AS dracc,
              accdr.accname AS draccname,
              acc.functioncode AS glcode,
              acc.glname AS glname,
              acc.objectcode AS accno,
              acc.accname AS accountname,
              c.num_receiptdet_amount AS credit,
              c.var_receiptdet_narration AS narration,
              c.num_receiptdet_partycode AS party,
              acc.accsubtypeid,
              NVL(a.num_receiptmst_deptid,1) AS accdeptid,
              a.num_receiptmst_budget_id AS budget_id,
              a.num_receiptmst_nidhi_id AS nidhi_id,
              a.num_receiptmst_subdeptid AS subdeptid,
              c.num_receiptdet_arramount,
              c.num_receiptdet_curramount,
              a.num_receiptmst_refno
          FROM aoac_receiptmst_def a
          INNER JOIN aoac_receiptdet_def c
              ON a.num_receiptmst_refno = c.num_receiptdet_refno
          LEFT JOIN accountview_web accdr
              ON a.num_receiptmst_drgl = accdr.glcode
             AND a.num_receiptmst_dracc = accdr.accno
             AND a.num_receiptmst_ulbid = accdr.ulbid
          LEFT JOIN accountview_web acc
              ON c.num_receiptdet_glcode = acc.glcode
             AND c.num_receiptdet_accno = acc.accno
             AND a.num_receiptmst_ulbid = acc.ulbid

          UNION ALL

          SELECT
              0 AS count,
              a.date_receiptmst_trnsdate AS trnsdate,
              a.num_receiptmst_recno AS recno,
              a.num_receiptmst_trnstypeid AS trnstypeid,
              a.num_receiptmst_zoneid AS zoneid,
              a.num_receiptmst_grampanchid AS grampanchid,
              accdr.functioncode AS drgl,
              accdr.glname AS drglname,
              accdr.objectcode AS dracc,
              accdr.accname AS draccname,
              acc.functioncode AS glcode,
              acc.glname AS glname,
              acc.objectcode AS accno,
              acc.accname AS accountname,
              c.num_receiptdesc_amount AS credit,
              c.var_receiptdesc_narration AS narration,
              c.num_receiptdesc_partycode AS party,
              acc.accsubtypeid,
              NVL(a.num_receiptmst_deptid,1) AS accdeptid,
              a.num_receiptmst_budget_id AS budget_id,
              a.num_receiptmst_nidhi_id AS nidhi_id,
              a.num_receiptmst_subdeptid AS subdeptid,
              c.num_receiptdesc_arramount AS num_receiptdet_arramount,
              c.num_receiptdesc_curramount AS num_receiptdet_curramount,
              a.num_receiptmst_refno
          FROM aoac_receiptmst_def a
          INNER JOIN aoac_receiptdesc_def c
              ON a.num_receiptmst_refno = c.num_receiptdesc_refno
          LEFT JOIN accountview_web accdr
              ON a.num_receiptmst_drgl = accdr.glcode
             AND a.num_receiptmst_dracc = accdr.accno
             AND a.num_receiptmst_ulbid = accdr.ulbid
          LEFT JOIN accountview_web acc
              ON c.num_receiptdesc_glcode = acc.glcode
             AND c.num_receiptdesc_accno = acc.accno
             AND a.num_receiptmst_ulbid = acc.ulbid
      )
      WHERE num_receiptmst_refno = :RefNo
    `;

    const result = await executeQuery(
      query,
      {
        RefNo: params.refNo
      }
    );

    return result.rows;

  } catch (err) {
    throw err;
  }
};
const getAccountMappingDetailRepoProperty = async (payload) => {
  try {
    const query = `
      SELECT
          d.var_accmpdet_glcode,
          d.var_accmpdet_glname,
          d.var_accmpdet_accno,
          d.var_accmpdet_accnoname,
          d.var_accmpdet_insby,
          d.dat_accmpdet_insdate
      FROM aoms_accusermap_mas m
      INNER JOIN aoms_accusermap_det d
          ON m.num_accusermap_id = d.num_accmpdet_mainid
      WHERE m.num_accusermap_userid = :userId
    `;

    const result = await executeQuery(query, {
      userId: payload.userId,
    });

    return result.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getReceiptListRepo,
  getZonesRepo,
  getCorporationRepo,
  getDepartmentsRepo,
  getNarrationRepo,
  getTransTypeRepo,
  getReceiptDetailsRepo,
  getPartyRepo,
  searchGLRepo,
  receiptInsertUpdateRepo,
  searchGLALLRepo,
  getBudgetHeadsRepo,
  getReceiptDetailsPdfRepo,
  getReceiptPDF,
  getUserMapHeaderRepo,
  getUserMapDetailsRepo,
  getAccountMappingDetailRepo,
  getReceiptDetailByRefNo,
  getAccountMappingDetailRepoProperty

};
