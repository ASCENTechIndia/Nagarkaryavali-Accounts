const { executeQuery } = require("../../../db/queryExecutor");
const { executeProcedure } = require("../../../db/procedureExecutor");
const oracledb = require("oracledb");

async function getVoucherAuthListRepo({ulbId, fromDate, toDate, zoneId, userId}) {
  console.log("📤 Repo: Fetch Voucher Approval List", {ulbId, fromDate, toDate, zoneId, userId});

  const conditions = [
    "NUM_VCHTRANS_STATUSPAY != 'A'",
    "NUM_VCHTRANS_STATUSPAY <> 'D'",
    "TRUNC(date_vchtrans_trnsdate) BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD') AND TO_DATE(:toDate,'YYYY-MM-DD')",
    "num_vchpremst_ulbid = :ulbId",
  ];

  const binds = {ulbId, fromDate, toDate};

  if (zoneId) {
    conditions.push("num_vchtrans_zoneid = :zoneId");
    binds.zoneId = zoneId;
  }

  if (userId) {
    conditions.push("num_vchtrans_insby = :userId");
    binds.userId = userId;
  }

  const sql = `
      SELECT
          num_vchtrans_vchtransno vchtransno,
          date_vchtrans_trnsdate transdate,
          var_trnstype_trnstype transtype,
          num_vchtrans_docno docno,
          num_vchtrans_chqno chqno,
          num_vchtrans_chqdate chqdate,
          var_budgetconfig_budgetname,
          zoneename deptname,
          var_grampanch_grampanch grampanch
      FROM aoac_vchtrans_def
      INNER JOIN aoac_vchprepmst_def
          ON num_vchtrans_vchrefno = num_vchprepmst_refno
      INNER JOIN aoac_trnstype_def
          ON num_trnstype_trnstypeid = num_vchtrans_trnstypeid
      LEFT JOIN view_zone
          ON zoneid = num_vchtrans_zoneid
      LEFT JOIN aoac_grampanch_def
          ON num_grampanch_grampanchid = num_vchtrans_grampanchid
      LEFT JOIN aoac_budgetconfig_det
          ON num_budgetconfig_headid = num_vchtrans_budgetid
         AND num_budgetconfig_level = 1
      WHERE ${conditions.join("\n AND ")}
      GROUP BY
          num_vchtrans_vchtransno,
          date_vchtrans_trnsdate,
          var_trnstype_trnstype,
          num_vchtrans_docno,
          num_vchtrans_chqno,
          num_vchtrans_chqdate,
          var_budgetconfig_budgetname,
          zoneename,
          var_grampanch_grampanch
      ORDER BY num_vchtrans_vchtransno
  `;

  const result = await executeQuery(sql, binds);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.rows;
}

async function getVoucherAuthByIdRepo({vchTransNo, ulbId}) {
  console.log("📤 Repo: Fetch Voucher Detail", {vchTransNo, ulbId});

  const sql = `
      SELECT
          num_vchprepmst_refno refno,
          date_vchprepmst_trnsdate trnsdate,
          num_vchprepmst_vchno vchno,
          zoneename zonename,
          var_grampanch_grampanch grampanch,
          num_vchprepmst_totalamt amount,
          var_partymst_partyname partyname,
          num_vchprepmst_insby username,
          date_vchprepmst_insdate datetime
      FROM aoac_vchprepmst_def
      INNER JOIN AOAC_VCHTRANS_DEF
          ON num_vchtrans_vchrefno = num_vchprepmst_refno
      INNER JOIN view_zone
          ON zoneid = num_vchprepmst_zoneid
      LEFT OUTER JOIN aoac_grampanch_def
          ON num_grampanch_deptid = num_vchprepmst_zoneid
         AND num_grampanch_grampanchid = num_vchprepmst_grampanchid
      LEFT OUTER JOIN aoac_partymst_def
          ON num_partymst_partyid = num_vchprepmst_partyid
      WHERE num_vchtrans_vchtransno = :vchTransNo
      AND num_vchpremst_ulbid = :ulbId
      ORDER BY num_vchprepmst_refno
  `;

  const binds = {vchTransNo, ulbId};

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }
  return result.rows;
}

async function saveVoucherApprovalRepo(payload) {
  console.log("📤 Repo: Execute Voucher Approval Procedure", payload);

  const sql = `
      BEGIN
          aoac_vchprepapproval_ins(
              :in_UserId,
              :in_RefNo,
              :in_Status,
              :in_Remark,
              :out_ErrorCode,
              :out_ErrorMsg
          );
      END;
  `;

  const binds = {
    in_UserId: payload.userId,
    in_RefNo: payload.refNo,
    in_Status: payload.status,
    in_Remark: payload.remark,
    out_ErrorCode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    out_ErrorMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 500,
    },
  };

  const result = await executeProcedure({sql, binds});
  console.log({sql, binds, result})
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.outBinds;
}

module.exports = {
  getVoucherAuthListRepo,
  getVoucherAuthByIdRepo,
  saveVoucherApprovalRepo,
};