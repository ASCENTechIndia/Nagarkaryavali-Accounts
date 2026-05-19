const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");
const oracledb = require("oracledb");



// ✅ 1. GL List
const getGLList = async () => {
  const query = `
    SELECT DISTINCT 
      num_glmaster_glcode || '-' || var_glmaster_glname AS glname,
      num_glmaster_glcode AS glcode
    FROM aoac_glmaster_def
    INNER JOIN aoac_accmaster_def 
      ON num_accmaster_glcode = num_glmaster_glcode
  `;
  return await executeQuery(query);
};

// ✅ 2. Party List
const getPartyList = async ({ corp_id }) => {
  const query = `
    SELECT 
      var_partymst_partyname,
      num_partymst_partyid
    FROM aoac_partymst_def
    WHERE num_partymst_ulbid = :corp_id
    ORDER BY var_partymst_partyname
  `;
  return await executeQuery(query, { corp_id });
};

// ✅ 3. Balance Voucher Details
// const getBalanceVoucherDetails = async (params) => {

//   let query = `
//     SELECT *
//     FROM (
//       SELECT 
//         trnsdate, refno, num_vchtransbal_vchtransbalno, vchno,
//         zonename, grampanch, partyname, totalamt,
//         drgl, glname, dracc, accname,
//         zoneid, ulbid, budgetid, amt,
//         partycode, prenarration, deptid,
//         NVL(totalamt, 0) - NVL(amt, 0) - NVL(bal, 0) AS balamt,
//         nidhiid
//       FROM (
//         SELECT 
//           trnsdate, refno, num_vchtransbal_vchtransbalno, vchno,
//           zonename, grampanch, partyname, totalamt,
//           drgl, glname, dracc, accname,
//           zoneid, ulbid, budgetid,
//           NVL(amt, 0) AS amt,
//           partycode, prenarration, deptid,
//           NVL(SUM(bal), 0) AS bal,
//           nidhiid
//         FROM vw_balvochdetails
//         GROUP BY 
//           trnsdate, refno, num_vchtransbal_vchtransbalno, vchno,
//           zonename, grampanch, partyname, totalamt,
//           drgl, glname, dracc, accname,
//           zoneid, ulbid, budgetid, amt,
//           partycode, prenarration, deptid, nidhiid
//       )
//     )
//     WHERE balamt > 0
//       AND zoneid = :zone_id
//       AND trnsdate BETWEEN 
//         TO_DATE(:from_date,'DD/MM/YYYY') 
//         AND 
//         TO_DATE(:to_date,'DD/MM/YYYY')
//       AND ulbid = :corp_id
//   `;

//   const binds = {
//     zone_id: params.zone_id,
//     from_date: params.from_date,
//     to_date: params.to_date,
//     corp_id: params.corp_id,
//   };

//   if (params.party_id !== null) {
//     query += ` AND partycode = :party_id `;
//     binds.party_id = params.party_id;
//   }

//   if (params.budget_id !== null) {
//     query += ` AND budgetid = :budget_id `;
//     binds.budget_id = params.budget_id;
//   }

//   if (params.nidhi_id !== null) {
//     query += ` AND nidhiid = :nidhi_id `;
//     binds.nidhi_id = params.nidhi_id;
//   }

//   console.log("query", query);
//   console.log("binds", binds);

//   return await executeQuery(query, binds);
// };

const getBalanceVoucherDetails = async (params) => {
  let query = `
    SELECT *
    FROM (
      SELECT
        trnsdate,
        refno,
        num_vchtransbal_vchtransbalno,
        vchno,
        zonename,
        grampanch,
        partyname,
        totalamt,
        drgl,
        glname,
        dracc,
        accname,
        zoneid,
        ulbid,
        budgetid,
        amt,
        partycode,
        prenarration,
        deptid,
        NVL(totalamt, 0) - NVL(amt, 0) - NVL(bal, 0) AS balamt,
        nidhiid
      FROM (
        SELECT
          trnsdate,
          refno,
          num_vchtransbal_vchtransbalno,
          vchno,
          zonename,
          grampanch,
          partyname,
          totalamt,
          drgl,
          glname,
          dracc,
          accname,
          zoneid,
          ulbid,
          budgetid,
          NVL(amt, 0) AS amt,
          partycode,
          prenarration,
          deptid,
          NVL(SUM(bal), 0) AS bal,
          nidhiid
        FROM vw_balvochdetails
        GROUP BY
          trnsdate,
          refno,
          num_vchtransbal_vchtransbalno,
          vchno,
          zonename,
          grampanch,
          partyname,
          totalamt,
          drgl,
          glname,
          dracc,
          accname,
          zoneid,
          ulbid,
          budgetid,
          amt,
          partycode,
          prenarration,
          deptid,
          nidhiid
      )
    )
    WHERE balamt > 0
      AND (:zone_id = -1 OR zoneid = :zone_id)
      AND TRUNC(trnsdate) BETWEEN
          TO_DATE(:from_date, 'DD/MM/YYYY')
          AND TO_DATE(:to_date, 'DD/MM/YYYY')
      AND ulbid = :corp_id
  `;

  const binds = {
    zone_id: Number(params.zone_id),
    from_date: params.from_date,
    to_date: params.to_date,
    corp_id: Number(params.corp_id),
  };

  if (params.party_id != null && params.party_id !== "") {
    query += ` AND partycode = :party_id `;
    binds.party_id = Number(params.party_id);
  }

  if (params.budget_id != null && params.budget_id !== "") {
    query += ` AND budgetid = :budget_id `;
    binds.budget_id = Number(params.budget_id);
  }

  if (params.nidhi_id != null && params.nidhi_id !== "") {
    query += ` AND nidhiid = :nidhi_id `;
    binds.nidhi_id = Number(params.nidhi_id);
  }

  query += ` ORDER BY trnsdate, vchno `;

  console.log("query:", query);
  console.log("binds:", binds);

  return await executeQuery(query, binds);
};


// ✅ 4. Voucher Prep List
const getVoucherPrepList = async (params) => {
  let query = `
    SELECT 
      num_vchprepmst_refno AS refno,
      date_vchprepmst_trnsdate AS trnsdate,
      num_vchprepmst_vchno AS vchno,
      zonemname AS zonename,
      var_grampanch_grampanch AS grampanch,
      var_partymst_partyname AS partyname,
      num_vchprepmst_totalamt AS totalamt,
      acc.functioncode AS drgl,
      acc.glname,
      acc.objectcode AS dracc,
      acc.accname,
      var_budgetconfig_budgetname AS budgetname,
      SUM(NVL(num_vchprepdet_amt,0)) AS amt,
      NVL(num_vchprepmst_totalamt,0) - SUM(NVL(num_vchprepdet_amt,0)) AS balamt,
      var_vchpremst_narration AS prenarration,
      num_vchprepmst_deptid AS deptid,
      num_vchprepmst_partyid AS partycode
    FROM aoac_vchprepmst_def
    LEFT JOIN aoac_budgetconfig_det 
      ON num_budgetconfig_headid = num_vchpremst_budget_id 
      AND num_budgetconfig_level = 1
    LEFT JOIN aoac_vchprepdet_def 
      ON num_vchprepdet_refno = num_vchprepmst_refno
    INNER JOIN view_zone 
      ON zoneid = num_vchprepmst_zoneid
    LEFT JOIN aoac_grampanch_def 
      ON num_grampanch_grampanchid = num_vchprepmst_grampanchid
    LEFT JOIN aoac_partymst_def 
      ON num_partymst_partyid = num_vchprepmst_partyid
    INNER JOIN accountview_web acc 
      ON acc.glcode = num_vchprepmst_drgl 
      AND acc.accno = num_vchprepmst_dracc 
      AND acc.ulbid = num_vchpremst_ulbid
    WHERE var_vchprepmst_authstatus IS NULL
      AND var_vchprepmst_approvestatus IS NULL
      AND num_vchprepmst_refno NOT IN (
        SELECT num_vchtrans_vchrefno 
        FROM aoac_vchtrans_def 
        WHERE num_vchtrans_ulbid = :corp_id
      )
      AND num_vchprepmst_zoneid = :zone_id
  `;

  const binds = {
    corp_id: Number(params.corp_id),
    zone_id: Number(params.zone_id),
  };

  // ✅ DATE FILTER
  if (params.from_date && params.to_date) {
    query += `
      AND date_vchprepmst_trnsdate BETWEEN 
        TO_DATE(:from_date,'DD-MM-YYYY') 
        AND 
        TO_DATE(:to_date,'DD-MM-YYYY')
    `;
    binds.from_date = params.from_date;
    binds.to_date = params.to_date;
  }

  // ✅ PARTY FILTER
  if (params.party_id) {
    query += ` AND num_vchprepmst_partyid = :party_id `;
    binds.party_id = Number(params.party_id);
  }

  // ✅ BUDGET FILTER (IMPORTANT FIX)
  if (params.budget_id && params.budget_id !== "0" && params.budget_id !== "") {
    query += ` AND num_vchpremst_budget_id = :budget_id `;
    binds.budget_id = Number(params.budget_id);
  }

  // ✅ NIDHI FILTER (IMPORTANT FIX)
  if (params.nidhi_id && params.nidhi_id !== "0" && params.nidhi_id !== "") {
    query += ` AND num_vchpremst_nidhi_id = :nidhi_id `;
    binds.nidhi_id = Number(params.nidhi_id);
  }

  // ✅ ALWAYS APPLY ULB
  query += ` AND num_vchpremst_ulbid = :corp_id `;

  query += `
    GROUP BY 
      num_vchprepmst_refno,
      date_vchprepmst_trnsdate,
      num_vchprepmst_vchno,
      zonemname,
      var_grampanch_grampanch,
      var_partymst_partyname,
      num_vchprepmst_totalamt,
      acc.functioncode,
      acc.glname,
      acc.objectcode,
      acc.accname,
      var_budgetconfig_budgetname,
      var_vchpremst_narration,
      num_vchprepmst_deptid,
      num_vchprepmst_partyid
    ORDER BY num_vchprepmst_refno
  `;

  return await executeQuery(query, binds);
};

// ✅ 5. Cheque Book
const getChequeBook = async (params) => {
  const query = `
    SELECT DISTINCT 
      TO_CHAR(m.num_chequebook_bookno) AS bookno,
      m.num_chequebook_bookno
    FROM aoac_chequebookdet_def d
    INNER JOIN aoac_chequebook_def m 
      ON m.num_chequebook_seqno = d.num_chequebook_seqno
    WHERE d.num_chequebook_trnsno IS NULL
      AND d.num_chequebook_bankglcode = :bank_glcode
      AND d.num_chequebook_bankaccno = :bank_accno
      AND d.num_chequebook_chqno = :cheque_no
      AND d.num_chequebook_ulbid = :corp_id
      AND (
        d.num_cheuebook_cancelupdateflag <> 'N'
        OR d.num_cheuebook_cancelupdateflag IS NULL
      )
      AND m.num_chequebook_zoneid = :zone_id
  `;

  const binds = {
    bank_glcode: params.bank_glcode,
    bank_accno: params.bank_accno,
    cheque_no: params.cheque_no,
    corp_id: params.corp_id,
    zone_id: params.zone_id,
  };

  return await executeQuery(query, binds);
};

// ✅ 6. Voucher Details (UPDATED)
const getVoucherDetails = async ({ refno_list, corp_id }) => {
  const query = `
    SELECT 
      date_vchprepmst_trnsdate trnsdate,
      num_vchprepmst_refno refno,
      num_vchprepmst_vchno vchno,
      vz.zoneename zone,
      var_partymst_partyname party,
      num_vchprepmst_totalamt totalamt,
      num_vchprepmst_drgl drgl,
      num_vchprepmst_drgl || '-' || accdr.glname drglname,
      num_vchprepmst_dracc dracc,
      num_vchprepmst_dracc || '-' || accdr.accname draccname,
      num_vchprepdet_glcode glcode,
      acc.glname,
      num_vchprepdet_accno accno,
      acc.accname,
      num_vchprepdet_amt Amount,
      var_vchprepdet_narratn Narration
    FROM aoac_vchprepdet_def
    INNER JOIN aoac_vchprepmst_def 
      ON num_vchprepmst_refno = num_vchprepdet_refno
    INNER JOIN VIEW_ACCOUNTSZONE acc 
      ON acc.glcode = num_vchprepdet_glcode 
      AND acc.accno = num_vchprepdet_accno 
    INNER JOIN VIEW_ACCOUNTSZONE accdr 
      ON accdr.glcode = num_vchprepmst_drgl 
      AND accdr.accno = num_vchprepmst_dracc 
    INNER JOIN view_zone vz 
      ON vz.zoneid = num_vchprepmst_zoneid
    INNER JOIN aoac_partymst_def 
      ON num_partymst_partyid = num_vchprepmst_partyid
    WHERE num_vchprepdet_refno IN (${refno_list.map((_, i) => `:ref${i}`).join(",")})
      AND num_vchpremst_ulbid = :corp_id
    ORDER BY num_vchprepdet_refno
  `;

  // 🔥 Dynamic binds for IN clause
  const binds = { corp_id };

  refno_list.forEach((val, i) => {
    binds[`ref${i}`] = Number(val);
  });

  return await executeQuery(query, binds);
};


const getVoucherTableDetails = async ({ voucher_no, corp_id }) => {
  const query = `
    SELECT 
      REFNO,
      PARTYID,
      PARTYNAME,
      ZONEENAME,
      ZONEID,
      DRGLCODE,
      DRACCNO,
      AMT,
      USERNAME,
      CRACNAME,
      CRAMT,
      NARRATION,
      ULBID,
      PREVCHNO,
      DEPTNAME,
      manualno,
      systembillno,
      transno,
      BALAMT,
      CHQNO,
      CHQDATE,
      CHQBOOKNO,
      BANKNAME,
      PAYMODE,
      TRANSDATE,
      GROSSAMOUNT
    FROM vw_vchgendtlsrpt
    WHERE REFNO = :voucher_no
      AND ULBID = :corp_id
  `;

  return await executeQuery(query, {
    voucher_no,
    corp_id,
  });
};


// ✅ 7. Tax Details
const getVoucherTaxDetails = async ({ voucher_no, corp_id }) => {
  const query = `
    SELECT 
      glcode,
      accno,
      amount,
      accname,
      ulbid,
      transno,
      payamt
    FROM vw_vchgendtlsrpt_details
    WHERE transno = :voucher_no
      AND ulbid = :corp_id
  `;

  return await executeQuery(query, {
    voucher_no,
    corp_id,
  });
};

// ✅ Voucher Generation (Procedure)
const voucherGeneration = (data) =>
  withTx(async (connection) => {
    console.log("Repo received:", data);

    const result = await connection.execute(
      `BEGIN
          aoac_vchgeneration_ins(
            :In_RefNo,
            :In_TrnsSourceId,
            :In_TrnsStatus,
            :In_Str1,
            :In_Str2,
            :In_Str3,
            :In_Str4,
            :In_UserId,
            :out_ErrorCode,
            :out_ErrorMsg
          );
       END;`,
      {
        In_RefNo: data.refNo,
        In_TrnsSourceId: data.txnSourceId,
        In_TrnsStatus: data.txnStatus,
        In_Str1: data.str1 || null,
        In_Str2: data.str2 || null,
        In_Str3: data.str3 || null,
        In_Str4: data.str4 || null,
        In_UserId: data.userId || null,

        out_ErrorCode: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER,
        },
        out_ErrorMsg: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 1000,
        },
      }
    );

        console.log("Repo Result:", result);

    return {
      errorCode: result.outBinds.out_ErrorCode,
      message: result.outBinds.out_ErrorMsg,
    };
  });


  const getCounterVoucherHeader = async ({ refno, ulbId }) => {
  const query = `
    SELECT 
        REFNO, PARTYID, PARTYNAME, ZONEENAME, ZONEID,
    DRGLCODE, DRACCNO, AMT, USERNAME,
    CRACNAME, CRAMT, NARRATION, ULBID,
    PREVCHNO, DEPTNAME, MANUALNO, SYSTEMBILLNO,
    TRANSNO, BALAMT,
    CHQNO, CHQDATE, CHQBOOKNO, BANKNAME,
    PAYMODE, TRANSDATE, GROSSAMOUNT
    FROM vw_vchgendtlsrpt
    WHERE REFNO = :refno
      AND ULBID = :ulbId
  `;

  return await executeQuery(query, { refno, ulbId });
};

const getCounterVoucherDetails = async ({ transno, ulbId }) => {
  console.log("Payload received:", {transno, ulbId});
  const query = `
    SELECT 
       GLCODE, ACCNO, AMOUNT, ACCNAME,
    ULBID, TRANSNO, PAYAMT
    FROM vw_vchgendtlsrpt_details
    WHERE TRANSNO = :transno
      AND ULBID = :ulbId
  `;

  return await executeQuery(query, { transno, ulbId });
};


module.exports = {
  getGLList,
  getPartyList,
  getBalanceVoucherDetails,
  getVoucherPrepList,
  getChequeBook,
  getVoucherDetails,
  getVoucherTableDetails,
  getVoucherTaxDetails,
  voucherGeneration,
  getCounterVoucherHeader,
  getCounterVoucherDetails
};