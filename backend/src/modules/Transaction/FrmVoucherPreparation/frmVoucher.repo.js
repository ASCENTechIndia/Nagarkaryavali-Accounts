const { executeQuery } = require("../../../db/queryExecutor");
const { executeProcedure } = require("../../../db/procedureExecutor");
const oracledb = require("oracledb");


/* 1 */
async function getPendingVouchersRepo({ zoneId, ulbId }) {
  const sql = `
      SELECT 
        v.num_vchprepmst_zoneid AS zoneid,
        v.num_vchprepmst_refno AS refno,
        v.date_vchprepmst_trnsdate AS trnsdate,
        v.num_vchprepmst_vchno AS vchno,
        z.zonemname AS zonename,
        gp.var_grampanch_grampanch AS grampanch,
        v.num_vchprepmst_totalamt AS amount,
        p.var_partymst_partyname AS partyname,
        v.num_vchprepmst_insby AS username,
        v.date_vchprepmst_insdate AS datetime
      FROM aoac_vchprepmst_def v

      INNER JOIN view_zone z 
        ON z.zoneid = v.num_vchprepmst_zoneid

      LEFT JOIN aoac_grampanch_def gp 
        ON gp.num_grampanch_deptid = v.num_vchprepmst_zoneid 
        AND gp.num_grampanch_grampanchid = v.num_vchprepmst_grampanchid

      LEFT JOIN aoac_partymst_def p 
        ON p.num_partymst_partyid = v.num_vchprepmst_partyid

      WHERE 
        (v.var_vchprepmst_authstatus IS NULL OR v.var_vchprepmst_authstatus = '')
        AND v.num_vchprepmst_refno NOT IN (
          SELECT num_vchtrans_vchrefno 
          FROM aoac_vchtrans_def 
          WHERE num_vchtrans_ulbid = :ulbId
        )
        AND v.num_vchprepmst_zoneid = :zoneId
        AND v.num_vchpremst_ulbid = :ulbId

      ORDER BY v.date_vchprepmst_trnsdate DESC
    `;

  const result = await executeQuery(sql, { zoneId, ulbId });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 2 */
async function getDepositeDropdownRepo({ ulbId }) {
  const sql = `
    SELECT var_depositmst_deposittype, num_depositmst_deposittypeid
    FROM aoac_deposittypemst_def
    WHERE num_depositmst_ulbid = :ulbId
  `;

  const result = await executeQuery(sql, { ulbId });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 3 */
async function getSectionDropdownRepo() {
  const sql = `
    SELECT var_sectionmst_sectionname, num_sectionmst_sectionid
    FROM aoac_sectionmst_def
  `;

  const result = await executeQuery(sql);

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 4 */
async function getBudgetHeadRepo({ budgetLevel }) {
  const sql = `
    SELECT var_budgetconfig_budgetname, num_budgetconfig_headid
    FROM aoac_budgetconfig_det
    WHERE num_budgetconfig_level = :budgetLevel
  `;

  const result = await executeQuery(sql, { budgetLevel });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 5 */
async function getBankDetailsRepo({ bankID }) {
  const sql = `
      SELECT 
    pb.num_partybank_id,
    b.var_bankmst_bankname,
    br.var_branchmst_branchname,
    pb.var_partybank_ifsc,
    pb.var_partybank_accountno
FROM aoac_partybank_dtls pb
INNER JOIN aoac_branchmst_def br 
    ON pb.num_partybank_branchid = br.num_branchmst_branchid
INNER JOIN aoac_bankmst_def b 
    ON pb.num_partybank_bankid = b.num_bankmst_bankid
WHERE pb.num_partybank_id = :bankID
    `;

  const result = await executeQuery(sql, { bankID });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 6 */
async function getVoucherDetailsRepo({ refno, zoneid, ulbid }) {
  const sql = `
      SELECT 
        num_vchprepmst_partyid AS partyid,
        num_vchprepmst_zoneid AS zoneid,
        num_vchprepmst_grampanchid AS grampanchid,
        date_vchprepmst_trnsdate AS trnsdate,
        num_vchprepmst_vchno AS vchno,
        num_vchprepmst_totalamt AS totalamt,
        accdr.functioncode AS drgl,
        accdr.objectcode AS dracc,
        accdr.glname AS drglname,
        accdr.accname AS draccname,
        a.num_vchprepmst_partybankid AS PartyBankId,
        var_vchpremst_narration,
        a.num_vchpremst_budget_id,
        var_partymst_partyname AS PartyName,
        a.num_vchpremst_nidhi_id AS nidhi_id,
        num_vchprepmst_contractid,
        var_vchprepmst_accyear,
        num_vchprepmst_deptid AS deptid,
        var_vchprepmst_efileno AS efileno,
        dat_vchprepmst_approvaldate AS approvaldate
      FROM aoac_vchprepmst_def a
      INNER JOIN accountview_web accdr 
        ON a.num_vchprepmst_drgl = accdr.glcode 
        AND a.num_vchprepmst_dracc = accdr.accno
        AND a.num_vchpremst_ulbid = accdr.ulbid
      LEFT JOIN aoac_partymst_def 
        ON num_partymst_partyid = num_vchprepmst_partyid
      WHERE 
        a.num_vchprepmst_refno = :refno
        AND num_vchprepmst_zoneid = :zoneid
        AND num_vchpremst_ulbid = :ulbid
    `;

  const result = await executeQuery(sql, { refno, zoneid, ulbid });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 7 */
async function getVoucherDetailLinesRepo({ refno, ulbid }) {
   const sql = `
      SELECT 
        a.num_vchprepdet_refno,
        accdr.functioncode AS glcode,
        accdr.glname AS glname,
        accdr.objectcode AS accno,
        accdr.accname AS accname,
        a.num_vchprepdet_amt AS amt,
        a.var_vchprepdet_narratn AS narratn,
        rsd.num_secdepodet_partyid AS partyid,
        rsd.num_secdepodet_deptid AS deptid,
        rsd.num_secdepodet_depotypeid AS depotypeid,
        rsd.num_secdepodet_depono AS depono,
        rsd.num_secdepodet_bankaccno AS bankaccno,
        rsd.var_secdepodet_depodetail AS depodetail,
        tax.num_vchprepgovttax_rate AS rate,
        tax.num_vchprepgovttax_sectionid AS sectionid,
        accdr.accsubtypeid AS balscode
      FROM aoac_vchprepdet_def a   
      INNER JOIN aoac_vchprepmst_def m 
        ON m.num_vchprepmst_refno = a.num_vchprepdet_refno
      INNER JOIN accountview_web accdr 
        ON a.num_vchprepdet_glcode = accdr.glcode 
        AND a.num_vchprepdet_accno = accdr.accno
        AND accdr.ulbid = m.num_vchpremst_ulbid
      LEFT JOIN aoac_recsecdepodet_def rsd 
        ON rsd.num_secdepodet_refno = a.num_vchprepdet_refno
      LEFT JOIN aoac_vchprepgovttax_def tax 
        ON tax.num_vchprepgovttax_refno = a.num_vchprepdet_refno 
        AND a.num_vchprepdet_glcode = tax.num_vchprepgovttax_glcode 
        AND a.num_vchprepdet_accno = tax.num_vchprepgovttax_accno
      WHERE 
        a.num_vchprepdet_refno = :refno
        AND m.num_vchpremst_ulbid = :ulbid
    `;

  const result = await executeQuery(sql, { refno, ulbid });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 8 */
async function getAccountByGlAccRepo({ glcode, accno }) {
  const sql = `
    SELECT accname, accsubtypeid
    FROM accountview_web
    WHERE glcode = :glcode AND accno = :accno
  `;

  const result = await executeQuery(sql, { glcode, accno });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 9 */
async function getSecDepositCodeRepo({ glcode, accno, ulbid }) {
  const sql = `
    SELECT num_secdepositcode_accsubtype
    FROM aoac_secdepositcode_det
    WHERE num_secdepositcode_glcode = :glcode
    AND num_secdepositcode_accno = :accno
    AND num_secdepositcode_ulbid = :ulbid
  `;

  const result = await executeQuery(sql, { glcode, accno, ulbid });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 10 */
async function getAccountByFunctionRepo({ functioncode, objectcode, ulbid }) {
  const sql = `
     SELECT accname AS AccName, accsubtypeid
      FROM accountview_web 
      WHERE functioncode = :functioncode 
      AND objectcode = :objectcode  
      AND ulbid = :ulbid
  `;

  const result = await executeQuery(sql, { functioncode, objectcode, ulbid });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 11 */
async function getCorporationCodeRepo({ corporationId }) {
  const sql = `
    SELECT var_corporation_code
    FROM admins.aoma_corporation_mas
    WHERE num_corporation_id = :corporationId
  `;

  const result = await executeQuery(sql, { corporationId });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 12 */
async function getContractsRepo({ contractorid, zoneid }) {
  const sql = `
    SELECT var_contractmst_desc, num_contractmst_id
    FROM aoac_contract_mst_def
    WHERE num_contractmst_contractorid = :contractorid
    AND num_contractmst_zoneid = :zoneid
  `;

  const result = await executeQuery(sql, { contractorid, zoneid });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 13 */
async function getContractAccYearRepo({ contractid }) {
  const sql = `
    SELECT var_contractdet_accyr, num_contractdet_id 
      FROM aoac_contract_det_def 
      WHERE num_contractdet_id = :contractid 
      AND num_contractdet_transno IS NULL
  `;

  const result = await executeQuery(sql, { contractid });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 14 */
async function getPartyBankDetailsRepo({ partyid }) {
  const sql = `
      SELECT 
        pb.num_partybank_id,
        pb.num_partybank_partyid,
        b.var_bankmst_bankname,
        pb.num_partybank_branchid,
        br.var_branchmst_branchname,
        pb.var_partybank_ifsc,
        pb.var_partybank_accountno,
        pb.var_partybank_status
      FROM aoac_partybank_dtls pb
      INNER JOIN aoac_bankmst_def b 
        ON pb.num_partybank_bankid = b.num_bankmst_bankid
      INNER JOIN aoac_branchmst_def br 
        ON br.num_branchmst_branchid = pb.num_partybank_branchid
      WHERE 
        pb.num_partybank_partyid = :partyid
        AND pb.var_partybank_status = 'Open'
    `;

  const result = await executeQuery(sql, { partyid });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 15 */
async function getPartyTaxDetailsRepo({ partyid, ulbid }) {
  const sql = `
    SELECT var_partymst_pancard, var_partymst_gstno
    FROM aoac_partymst_def
    WHERE num_partymst_partyid = :partyid
    AND num_partymst_ulbid = :ulbid
  `;

  const result = await executeQuery(sql, { partyid, ulbid });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 16 */
async function getNidhiConfigRepo({ budgetid, ulbid, nidhiFlag }) {
  const sql = `
    SELECT NIDHINAME, NIDHIID
    FROM vw_nidhi_config
    WHERE BUDGETID = :budgetid
    AND NIDHIFLAG = :nidhiFlag
    AND ULBID = :ulbid
  `;

  const result = await executeQuery(sql, { budgetid, ulbid, nidhiFlag });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 17 */
async function getGovtTaxAccRepo({ accsubtype }) {
  const sql = `
    SELECT num_govtaxcode_accno
    FROM acccloud.aoac_govtaxcode_det
    WHERE num_govtaxcode_accsubtype = :accsubtype
  `;

  const result = await executeQuery(sql, { accsubtype });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

/* 18 */
async function getVoucherReceiptDetailsRepo({ refno, ulbid }) {
  const sql = `
    SELECT 
        REFNO, PARTYID, PARTYNAME, PANCARD, ZONEENAME, ZONEID,
        DRGLCODE, DRACCNO, AMT, USERNAME,
        DRGLNAME, DRACNAME, CRGLCODE, CRGLACC, CRGLNAME, CRACNAME,
        CRAMT, NARRATION, DEPTNAME, ULBID, transdate
      FROM vw_vchpreprecdtls
      WHERE REFNO = :refno AND ULBID = :ulbid
  `;

  const result = await executeQuery(sql, { refno, ulbid });

  if (!result.success) throw new Error(result.error);

  return result.rows;
}

async function saveVoucherRepo(payload) {
  console.log("📤 Repo: Save Voucher", payload);

  const sql = `
    BEGIN
      aoac_voucherpreparation_ins(
        :In_UserId,
        :In_ParamStr,
        :In_ParamStr2,
        :In_ParamStr3,
        :In_ParamStr4,
        :In_ZoneId,
        :out_ReturnStr,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    // ✅ ORDER MATTERS (match procedure exactly)
    In_UserId: String(payload.userId),
    In_ParamStr: String(payload.paramStr),

    In_ParamStr2: payload.paramStr2 || null,
    In_ParamStr3: payload.paramStr3 || null,
    In_ParamStr4: payload.paramStr4 || null,

    In_ZoneId: Number(payload.zoneId),

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
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({ sql, binds });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}

async function deleteVoucherRepo(payload) {
  console.log("📤 Repo: Delete Voucher", payload);

  const sql = `
    BEGIN
      aoac_voucherpreparation_Delete(
        :In_UserId,
        :In_Refno,
        :In_orgid,
        :out_ReturnStr,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    In_UserId: String(payload.userId),
    In_Refno: String(payload.refNo),
    In_orgid: String(payload.orgId),

    out_ReturnStr: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 100,
    },
    out_ErrorCode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    out_ErrorMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({
    sql,
    binds
    
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}

module.exports = {
  getPendingVouchersRepo,
  getDepositeDropdownRepo,
  getSectionDropdownRepo,
  getBudgetHeadRepo,
  getBankDetailsRepo,
  getVoucherDetailsRepo,
  getVoucherDetailLinesRepo,
  getAccountByGlAccRepo,
  getSecDepositCodeRepo,
  getAccountByFunctionRepo,
  getCorporationCodeRepo,
  getContractsRepo,
  getContractAccYearRepo,
  getPartyBankDetailsRepo,
  getPartyTaxDetailsRepo,
  getNidhiConfigRepo,
  getGovtTaxAccRepo,
  getVoucherReceiptDetailsRepo,
  saveVoucherRepo,
  deleteVoucherRepo
};