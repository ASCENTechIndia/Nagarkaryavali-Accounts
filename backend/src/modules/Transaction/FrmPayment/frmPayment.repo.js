const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");

async function getFrmPaymentRepo({ zoneId, ulbId }) {
  console.log("📤 Repo: Fetch FrmPayment", { zoneId, ulbId });

  const sql = `
    SELECT 
        num_payment_refno AS refno, 
        date_payment_trnsdate AS trnsdate, 
        num_payment_vchno AS docno,
        var_trnstype_trnstypemar AS trnstype, 
        zoneename AS zonename, 
        var_grampanch_grampanch AS grampanch, 
        SUM(num_paymentdet_amount) AS amount,
        var_payment_insby AS username, 
        date_payment_insdate AS datetime, 
        num_payment_trnstype AS trnstypeid 
    FROM aoac_payment_def 
    INNER JOIN aoac_paymentdet_def 
        ON num_paymentdet_refno = num_payment_refno 
    INNER JOIN aoac_trnstype_def 
        ON num_trnstype_trnstypeid = num_payment_trnstype 
    INNER JOIN view_zone 
        ON zoneid = num_payment_zoneid 
    LEFT OUTER JOIN aoac_grampanch_def 
        ON num_grampanch_deptid = num_payment_zoneid 
        AND num_grampanch_grampanchid = num_payment_grampanchid 
    WHERE var_payment_authstatus IS NULL 
        AND num_trnssource_sourceid IN (3, 4)
        AND num_payment_zoneid = :zoneId
        AND num_payment_ulbid = :ulbId
    GROUP BY 
        num_payment_refno, 
        date_payment_trnsdate, 
        num_payment_vchno, 
        var_trnstype_trnstypemar, 
        zoneename, 
        var_grampanch_grampanch, 
        var_payment_insby, 
        date_payment_insdate, 
        num_payment_trnstype 
    ORDER BY num_payment_refno
  `;

  const binds = { zoneId, ulbId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getTransactionTypeRepo() {
  console.log("📤 Repo: Fetch Transaction Types");

  const sql = `
    SELECT 
        num_trnstype_trnstypeid AS id, 
        var_trnstype_trnstype AS englishname, 
        var_trnstype_trnstypemar AS marathiname 
    FROM aoac_trnstype_def 
    WHERE num_trnstype_trnstypeid IN (3, 4)
    ORDER BY num_trnstype_trnstypeid
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getPartyMasterRepo({ ulbId }) {
  console.log("📤 Repo: Fetch Party Master", { ulbId });

  const sql = `
    SELECT 
        num_partymst_partyid || '-' || var_partymst_partyname AS partyname,
        num_partymst_partyid AS partyid
    FROM aoac_partymst_def 
    WHERE num_partymst_ulbid = :ulbId
    ORDER BY var_partymst_partyname
  `;

  const binds = { ulbId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getAccountDetailsRepo({ glcode, accno }) {
  console.log("📤 Repo: Fetch Account Details", { glcode, accno });

  const sql = `
    SELECT 
      accname AS accname,
      accsubtypeid AS accsubtypeid,
      glcode AS glcode,
      accno AS accno
    FROM accountview_web
    WHERE glcode = :glcode 
      AND accno = :accno
  `;

  const binds = { glcode, accno };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getSecurityDepositRepo({ partyId, glcode, accno, ulbId }) {
  console.log("📤 Repo: Fetch Security Deposit", {
    partyId,
    glcode,
    accno,
    ulbId,
  });

  const sql = `
    SELECT 
        num_secdeposit_deptid AS deptid, 
        zonemname AS deptname, 
        num_secdeposit_depono AS depono, 
        num_secdepodet_amount AS amount,
        num_secdeposit_rectrnsno AS rectrnsno, 
        date_secdeposit_rectrnsdate AS rectrnsdate, 
        num_secdepodet_glcode AS glcode, 
        num_secdepodet_accno AS accno,
        num_secdeposit_partyid AS partyid,
        num_secdepodet_ulbid AS ulbid
    FROM aoac_secdeposit_def 
    INNER JOIN view_zone zm 
        ON num_secdeposit_deptid = zm.zoneid
    WHERE num_secdeposit_partyid = :partyId
        AND num_secdepodet_glcode = :glcode
        AND num_secdepodet_accno = :accno
        AND num_secdeposit_paytrnsno IS NULL
        AND date_secdeposit_paytrnsdate IS NULL 
        AND num_secdepodet_ulbid = :ulbId
    ORDER BY num_secdeposit_rectrnsno
  `;

  const binds = { partyId, glcode, accno, ulbId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getPaymentTypesRepo() {
  console.log("📤 Repo: Fetch Payment Types (1,2,3)");

  const sql = `
    SELECT 
        var_paymenttype_paymenttype AS displaytext, 
        num_paymenttype_paymenttypeid AS valuefield
    FROM aoac_paymenttype_def
    WHERE num_paymenttype_paymenttypeid IN (1, 2, 3)
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getAdvancePaymentTypeRepo() {
  console.log("📤 Repo: Fetch Payment Type (7)");

  const sql = `
    SELECT 
        var_paymenttype_paymenttype AS displaytext, 
        num_paymenttype_paymenttypeid AS valuefield
    FROM aoac_paymenttype_def
    WHERE num_paymenttype_paymenttypeid = 7
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getPaymentDetailsRepo({ refno }) {
  console.log("📤 Repo: Fetch Payment Details", { refno });

  const sql = `
    SELECT 
        a.date_payment_trnsdate AS trnsdate, 
        a.num_payment_vchno AS vchno, 
        a.num_payment_trnstype AS trnstype, 
        a.num_payment_zoneid AS zoneid, 
        a.num_payment_grampanchid AS grampanchid, 
        a.num_payment_chqno AS chqno, 
        a.date_payment_chqdate AS chqdate, 
        acr.functioncode AS crgl, 
        acr.glname AS glnamecr, 
        acr.objectcode AS cracc, 
        acr.accname AS accnamecr,
        ac.functioncode AS glcode, 
        ac.glname,
        ac.objectcode AS accno, 
        ac.accname, 
        c.num_paymentdet_amount AS amount, 
        c.var_paymentdet_narration AS narration, 
        c.num_paymentdet_partycode AS partycode, 
        p.var_partymst_partyname AS partyname, 
        a.num_budget_id AS accdeptid,
        a.num_payment_subdeptid AS subdeptid,
        a.num_payment_chqbookno AS chqbookno,
        a.num_payment_nidhi_id AS nidhi_id,
        a.num_payment_paymenttype AS paymenttype,
        a.var_payment_efileno AS efileno,
        a.dat_payment_approvaldate AS approvaldate,
        a.num_payment_refno AS refno
    FROM aoac_payment_def a
    INNER JOIN aoac_paymentdet_def c 
        ON c.num_paymentdet_refno = a.num_payment_refno 
    INNER JOIN accountview_web acr 
        ON a.num_payment_crgl = acr.glcode 
        AND a.num_payment_cracc = acr.accno 
    INNER JOIN accountview_web ac 
        ON c.num_paymentdet_glcode = ac.glcode 
        AND c.num_paymentdet_accno = ac.accno 
    LEFT OUTER JOIN aoac_partymst_def p 
        ON p.num_partymst_partyid = c.num_paymentdet_partycode 
    WHERE a.num_payment_refno = :refno
  `;

  const binds = { refno };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function searchAccountRepo({ ulbid, searchText, functionCode }) {
  console.log("📤 Repo: Search Account", { ulbid, searchText, functionCode });

  const sql = `
    SELECT 
      objectcode,
      objectcode || '-' || accname AS accname,
      functioncode,
      ulbid
    FROM accountview_web
    WHERE (ulbid = :ulbid OR :ulbid = '-1')
      AND functioncode = :functionCode
      AND (
        objectcode LIKE '%' || :searchText || '%' 
        OR accname LIKE '%' || :searchText || '%'
      )
  `;

  const binds = { ulbid, searchText, functionCode };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getAccountBalanceRepo({ targetDate, corpId, glcode, accno, ulbid }) {
  console.log("📤 Repo: Fetch Account Balance", {
    targetDate,
    corpId,
    glcode,
    accno,
    ulbid,
  });

  const sql = `
    SELECT 
      SUM(balance) AS balance,
      CASE 
        WHEN NVL(SUM(balance), 0) >= 0 THEN 'Cr.' 
        ELSE 'Dr.' 
      END AS crdr
    FROM (
      SELECT NVL(
        SUM(
          openingbal + (
            SELECT NVL(SUM(amount), 0) 
            FROM transview a  
            WHERE a.glcode = c.glcode
              AND a.accno = c.accno
              AND TRUNC(a.trnsdate) <= TO_DATE(:targetDate, 'DD-MON-YYYY') 
              AND a.ulbid = :corpId
          )
        ), 0
      ) AS balance
      FROM accountview_web c 
      WHERE c.glcode = :glcode  
        AND c.accno = :accno 
        AND c.ulbid = :ulbid
    )
  `;

  const binds = { targetDate, corpId, glcode, accno, ulbid };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows.length > 0 ? result.rows[0] : { balance: 0, crdr: "Cr." };
}

async function getCorporationByIdRepo({ corpId }) {
  console.log("📤 Repo: Fetch Corporation", { corpId });

  const sql = `
    SELECT 
      var_corporation_code AS corporationcode, 
      num_corporation_id AS corporationid
    FROM admins.aoma_corporation_mas
    WHERE num_corporation_id = :corpId
  `;

  const binds = { corpId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getPaymentDetailsViewRepo({ refno, ulbid }) {
  console.log("📤 Repo: Fetch Payment Details View", { refno, ulbid });

  const sql = `
    SELECT 
      REFNO, 
      VOUCHERNO, 
      TRANSDATE, 
      ZONEENAME, 
      CHQNO, 
      CHQBOOKNO, 
      PAYMENTTYPE,
      ACCNO, 
      ACCNAME, 
      AMT, 
      PARTYNAME, 
      PARTYCODE, 
      NARRATION, 
      ULBID,
      PACNO, 
      PCACCNAME,
      deyakdharak,
      TRANSNO
    FROM VW_Paymentdetails 
    WHERE REFNO = :refno
      AND ULBID = :ulbid
  `;

  const binds = { refno, ulbid };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function savePaymentRepo(payload) {
  console.log("📤 Repo: Execute Payment Procedure", payload);

  const sql = `
    BEGIN
      aoac_payment_ins(
        :In_ParamStr,
        :In_ParamStr2,
        :In_ParamStr3,
        :In_UserId,
        :in_ZoneId,
        :out_ReturnStr,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    In_ParamStr: payload.paramStr,
    In_ParamStr2: payload.paramStr2 || null,
    In_ParamStr3: payload.paramStr3 || null,
    In_UserId: payload.userId,
    in_ZoneId: payload.zoneId,

    out_ReturnStr: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 500 },
    out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 1000 },
  };

  const result = await executeProcedure({ sql, binds });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}

const getPaymentDetailsPDF = (refno, ulbid) =>
  executeQuery(
    `SELECT 
        REFNO,
        VOUCHERNO,
        TRANSDATE,
        ZONEENAME,
        CHQNO,
        CHQBOOKNO,
        PAYMENTTYPE,
        ACCNO,
        ACCNAME,
        AMT,
        PARTYNAME,
        PARTYCODE,
        NARRATION,
        ULBID,
        PACNO,
        PCACCNAME,
        deyakdharak,
        TRANSNO
     FROM VW_Paymentdetails
     WHERE REFNO = :refno
       AND ULBID = :ulbid`,
    { refno, ulbid },
  );

async function getGLListByTransactionTypeRepo({ trnstyid }) {
  console.log("📤 Repo: Fetch GL List By Transaction Type", { trnstyid });

  let sql = `
    SELECT DISTINCT 
      var_accmst_function || '-' || var_glmaster_glname AS glname, 
      var_accmst_function AS glcode,num_accmaster_accsubtype
    FROM aoac_glmaster_def 
    INNER JOIN aoac_accmaster_def 
      ON var_accmst_function = num_glmaster_glcode 
  `;

  // For transaction types 1 and 3
  if (trnstyid === "1" || trnstyid === "3") {
    sql += `
      and num_accmaster_accsubtype = 4810
    `;
  }

  // For transaction types 2 and 4
  if (trnstyid === "2" || trnstyid === "4") {
    sql += `
      AND num_accmaster_accsubtype IN (4820, 4822, 4821, 4823)
    `;
  }


  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

module.exports = {
  getFrmPaymentRepo,
  getTransactionTypeRepo,
  getPartyMasterRepo,
  getAccountDetailsRepo,
  getSecurityDepositRepo,
  getPaymentTypesRepo,
  getAdvancePaymentTypeRepo,
  getPaymentDetailsRepo,
  searchAccountRepo,
  getAccountBalanceRepo,
  getCorporationByIdRepo,
  getPaymentDetailsViewRepo,
  savePaymentRepo,
  getPaymentDetailsPDF,
  getGLListByTransactionTypeRepo
};
