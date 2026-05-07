const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");


async function getSdRefundList(filters) {
  const { 
    ulbId, 
    receiptNo, 
    voucherNo, 
    contrName, 
    collectionDate, 
    partyId 
  } = filters;

  let params = { ulbId };
  
  let sql = `
    SELECT 
      partycode, 
      partyname, 
      receiptno, 
      TO_CHAR(TRUNC(transdt), 'DD/MM/YYYY') AS transdt, 
      transamnt, 
      details, 
      status, 
      transno, 
      sdid 
    FROM View_SdRefundList 
    WHERE ulbid = :ulbId
  `;

  // 1. Receipt Number Filter
  if (receiptNo && receiptNo.trim() !== "") {
    sql += " AND receiptno = :receiptNo ";
    params.receiptNo = receiptNo;
  }

  // 2. Voucher Number Filter (Mapped from transDocno)
  if (voucherNo && voucherNo.trim() !== "") {
    sql += " AND transDocno = :voucherNo ";
    params.voucherNo = voucherNo;
  }

  // 3. Contractor Name Filter
  if (contrName && contrName.trim() !== "") {
    sql += " AND contrname = :contrName ";
    params.contrName = contrName;
  }

  // 4. Collection Date Filter
  if (collectionDate && collectionDate.trim() !== "") {
    sql += " AND transdt = TO_DATE(:collectionDate, 'DD-MON-YYYY') ";
    params.collectionDate = collectionDate;
  }

  // 5. Party Filter
  if (partyId && partyId.trim() !== "") {
    sql += " AND partycode = :partyId ";
    params.partyId = partyId;
  }

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function searchPartiesConcatenated(filters) {
  const { prefix, ulbId } = filters;
  
  const sql = `
    SELECT 
      num_partymst_partyid || '-' || var_partymst_partyname AS partyname,
      num_partymst_partyid AS partyid 
    FROM aoac_partymst_def 
    WHERE (
      UPPER(var_partymst_partyname) LIKE UPPER(:pattern) 
      OR TO_CHAR(num_partymst_partyid) LIKE :pattern
    )
    AND num_partymst_ulbid = :ulbId
    FETCH FIRST 50 ROWS ONLY
  `;

  const params = {
    pattern: `%${prefix}%`,
    ulbId: ulbId
  };

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);
  return result.rows;
}

async function searchPartiesStandard(filters) {
  const { prefix, ulbId } = filters;

  const sql = `
    SELECT 
      var_partymst_partyname AS partyname,
      num_partymst_partyid AS partyid 
    FROM aoac_partymst_def 
    WHERE (
      UPPER(var_partymst_partyname) LIKE UPPER(:pattern) 
      OR TO_CHAR(num_partymst_partyid) LIKE :prefixOnly
    )
    AND num_partymst_ulbid = :ulbId
    ORDER BY var_partymst_partyname
  `;

  const params = {
    pattern: `%${prefix}%`,
    prefixOnly: `${prefix}%`, // Second query used prefix match for ID
    ulbId: ulbId
  };

  const result = await executeQuery(sql, params);
  if (!result.success) throw new Error(result.error);
  return result.rows;
}

async function getCreditGLMaster() {
  const sql = `
    SELECT DISTINCT 
      num_glmaster_glcode || '-' || var_glmaster_glname AS glname, 
      num_glmaster_glcode AS glcode 
    FROM aoac_glmaster_def
    INNER JOIN aoac_accmaster_def ON num_accmaster_glcode = num_glmaster_glcode
    WHERE num_accmaster_accsubtype NOT IN (1, 2, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21)
    ORDER BY glname
  `;
  const result = await executeQuery(sql, {});
  return result.rows;
}

async function getDebitGLMaster() {
  const sql = `
    SELECT DISTINCT 
      num_glmaster_glcode || '-' || var_glmaster_glname AS glname, 
      num_glmaster_glcode AS glcode 
    FROM aoac_glmaster_def
    INNER JOIN aoac_accmaster_def ON num_accmaster_glcode = num_glmaster_glcode
    WHERE num_accmaster_accsubtype NOT IN (1, 2)
    ORDER BY glname
  `;
  const result = await executeQuery(sql, {});
  return result.rows;
}

async function checkRefundStatus(filters) {
  const { refNo, partyId, recNo, ulbId } = filters;
  const sql = `
    SELECT amount, payamt, partyid, recno, trnsno 
    FROM view_checkrefund 
    WHERE trnsno = :refNo 
      AND partyid = :partyId 
      AND recno = :recNo 
      AND ulbid = :ulbId
  `;
  const result = await executeQuery(sql, { refNo, partyId, recNo, ulbId });
  return result.rows;
}

async function getVoucherBySDID(sdid) {
  const sql = `
    SELECT num_vchprepmst_refno AS refno, num_vchprepmst_sdid AS sdid 
    FROM aoac_vchprepmst_def 
    WHERE num_vchprepmst_sdid = :sdid
  `;
  const result = await executeQuery(sql, { sdid });
  return result.rows;
}

async function getSDVoucherMaster(filters) {
  const { refNo, partyId, ulbId, sdid } = filters;
  const sql = `
    SELECT 
      PARTYID, ZONEID, GRAMPANCHID, TRNSDATE, VCHNO, TOTALAMT, DRGL, DRACC, 
      DRGLNAME, DRACCNAME, PARTYBANKID, VAR_RECEIPTDET_NARRATION, 
      NUM_RECEIPTMST_BUDGET_ID, PARTYNAME, NIDHI_ID, REFNO, DEPTID 
    FROM view_sdvchmstdtls 
    WHERE REFNO = :refNo 
      AND PARTYID = :partyId 
      AND ulbid = :ulbId 
      AND sdid = :sdid
  `;
  const result = await executeQuery(sql, { refNo, partyId, ulbId, sdid });
  return result.rows;
}

async function getPartyBankDetails(partyBankId, ulbId) {
  const sql = `
    SELECT 
      b.num_partybank_id,
      bk.var_bankmst_bankname,
      br.var_branchmst_branchname,
      b.var_partybank_ifsc,
      b.var_partybank_accountno 
    FROM aoac_partybank_dtls b
    INNER JOIN aoac_partymst_def p ON p.num_partymst_partyid = b.num_partybank_partyid
    INNER JOIN aoac_branchmst_def br ON br.num_branchmst_branchid = b.num_partybank_branchid
    INNER JOIN aoac_bankmst_def bk ON bk.num_bankmst_bankid = b.num_partybank_bankid
    WHERE b.num_partybank_id = :partyBankId 
      AND p.num_partymst_ulbid = :ulbId
  `;
  const result = await executeQuery(sql, { partyBankId, ulbId });
  return result.rows;
}

async function getSDVoucherDetails(filters) {
  const { refNo, partyId, sdid, ulbId } = filters;
  const sql = `
    SELECT 
      REFNO, GLCODE, GLNAME, ACCNO, ACCNAME, AMT, NARRATN, PARTYID, 
      DEPTID, DEPOTYPEID, DEPONO, BANKACCNO, DEPODETAIL, RATE, 
      SECTIONID, ACCSUBTYPE, RECTRANSNO 
    FROM view_sdvchdetls 
    WHERE REFNO = :refNo 
      AND PARTYID = :partyId 
      AND sdid = :sdid 
      AND ULBID = :ulbId
  `;
  const result = await executeQuery(sql, { refNo, partyId, sdid, ulbId });
  return result.rows;
}

async function getVoucherPrepMaster(refNo, ulbId) {
  const sql = `
    SELECT 
      a.num_vchprepmst_partyid AS partyid,
      a.num_vchprepmst_zoneid AS zoneid,
      a.num_vchprepmst_grampanchid AS grampanchid,
      a.date_vchprepmst_trnsdate AS trnsdate,
      a.num_vchprepmst_vchno AS vchno,
      a.num_vchprepmst_totalamt AS totalamt,
      a.num_vchprepmst_drgl AS drgl,
      a.num_vchprepmst_dracc AS dracc,
      accdr.glname AS drglname,
      accdr.accname AS draccname,
      a.num_vchprepmst_partybankid AS PartyBankId,
      a.var_vchpremst_narration,
      a.num_vchpremst_budget_id,
      p.var_partymst_partyname AS PartyName,
      a.num_vchpremst_nidhi_id AS nidhi_id,
      sd.dat_recsecdepodet_certino AS certino,
      sd.dat_recsecdepodet_sddt AS sddt,
      NVL(a.num_vchpremst_totdeduamt, 0) AS totdeduamt,
      (NVL(a.num_vchprepmst_totalamt, 0) - NVL(a.num_vchpremst_totdeduamt, 0)) AS payamt
    FROM aoac_vchprepmst_def a
    INNER JOIN accountview_web accdr 
       ON a.num_vchprepmst_drgl = accdr.glcode 
      AND a.num_vchprepmst_dracc = accdr.accno
    INNER JOIN aoac_recsecdepodet_def sd 
       ON sd.num_secdepodet_refno = a.num_vchprepmst_refno 
      AND sd.num_secdepodet_partyid = a.num_vchprepmst_partyid
    LEFT JOIN aoac_partymst_def p 
       ON p.num_partymst_partyid = a.num_vchprepmst_partyid
    WHERE a.num_vchprepmst_refno = :refNo 
      AND a.num_vchpremst_ulbid = :ulbId
  `;

  const result = await executeQuery(sql, { refNo, ulbId });
  return result.rows;
}

async function getGeneralBankDetails(partyBankId) {
  const sql = `
    SELECT 
      b.num_partybank_id,
      bk.var_bankmst_bankname,
      br.var_branchmst_branchname,
      b.var_partybank_ifsc,
      b.var_partybank_accountno 
    FROM aoac_partybank_dtls b
    INNER JOIN aoac_branchmst_def br ON b.num_partybank_branchid = br.num_branchmst_branchid
    INNER JOIN aoac_bankmst_def bk ON b.num_partybank_bankid = bk.num_bankmst_bankid
    WHERE b.num_partybank_id = :partyBankId
  `;

  const result = await executeQuery(sql, { partyBankId });
  return result.rows;
}

async function getSDUpdatedDetails(refNo, ulbId) {
  const sql = `
    SELECT 
      NUM_SECDEPODET_REFNO, 
      GLCODE, 
      GLNAME, 
      ACCNO, 
      ACCNAME, 
      AMT, 
      NARRATN, 
      PARTYID, 
      DEPTID, 
      DEPOTYPEID, 
      DEPONO, 
      BANKACCNO, 
      DEPODETAIL, 
      RATE, 
      SECTIONID, 
      ACCSUBTYPE 
    FROM vw_sdupdatedlts 
    WHERE NUM_SECDEPODET_REFNO = :refNo 
      AND ulbid = :ulbId
  `;

  const result = await executeQuery(sql, { refNo, ulbId });
  return result.rows;
}

async function getSDAccountSubtype(filters) {
  const { debitGl, debitAcc, ulbId } = filters;
  const sql = `
    SELECT num_secdepositcode_accsubtype AS accsubtype 
    FROM aoac_secdepositcode_det 
    WHERE num_secdepositcode_glcode = :debitGl 
      AND num_secdepositcode_accno = :debitAcc 
      AND num_secdepositcode_ulbid = :ulbId
  `;
  const result = await executeQuery(sql, { debitGl, debitAcc, ulbId });
  return result.rows;
}

async function getPartyBankList(partyId) {
  const sql = `
    SELECT 
      num_partybank_id, 
      NUM_PARTYBANK_PARTYID,
      var_bankmst_bankname, 
      NUM_PARTYBANK_BRANCHID,
      var_branchmst_branchname,
      VAR_PARTYBANK_IFSC, 
      VAR_PARTYBANK_ACCOUNTNO, 
      VAR_PARTYBANK_STATUS 
    FROM aoac_partybank_dtls 
    INNER JOIN aoac_bankmst_def ON num_partybank_bankid = num_bankmst_bankid
    INNER JOIN aoac_branchmst_def ON num_branchmst_branchid = num_partybank_branchid
    WHERE num_partybank_partyid = :partyId 
      AND var_partybank_status = 'Open'
  `;
  const result = await executeQuery(sql, { partyId });
  return result.rows;
}

async function getBudgetBalance(filters) {
  const { creditGl, creditAcc, ulbId } = filters;
  const sql = `
    SELECT NVL(SUM(
      (SELECT num_budgetaccmap_budgetprov 
       FROM aoac_budgetaccmap_det b 
       WHERE num_budgetaccmap_glcode = :creditGl 
         AND num_budgetaccmap_accountno = :creditAcc
      ) - openingbal + 
      (SELECT NVL(SUM(amount), 0) 
       FROM transview a 
       WHERE a.glcode = c.glcode 
         AND a.accno = c.accno
      )
    ), 0) AS balance 
    FROM accountview_web c 
    WHERE glcode = :creditGl 
      AND accno = :creditAcc 
      AND ulbid = :ulbId
  `;
  const result = await executeQuery(sql, { creditGl, creditAcc, ulbId });
  return result.rows;
}

async function getPartyTaxDetails(partyId, ulbId) {
  const sql = `
    SELECT var_partymst_pancard, var_partymst_gstno 
    FROM aoac_partymst_def 
    WHERE num_partymst_partyid = :partyId 
      AND num_partymst_ulbid = :ulbId
  `;
  const result = await executeQuery(sql, { partyId, ulbId });
  return result.rows;
}

async function getSDVoucherPrepReceiptDetails(voucherNo, ulbId) {
  const sql = `
    SELECT 
      REFNO, 
      PARTYID, 
      PARTYNAME, 
      PANCARD, 
      ZONEENAME, 
      ZONEID, 
      DRGLCODE, 
      DRACCNO,
      AMT, 
      USERNAME, 
      DRGLNAME, 
      DRACNAME, 
      CRGLCODE, 
      CRGLACC, 
      CRGLNAME, 
      CRACNAME,
      CRAMT, 
      NARRATION, 
      DEPTNAME, 
      ULBID,
      transdate 
    FROM vw_sdvchpreprecdtls 
    WHERE REFNO = :voucherNo 
      AND ULBID = :ulbId
  `;

  const result = await executeQuery(sql, { 
    voucherNo: voucherNo.trim(), 
    ulbId: ulbId 
  });
  
  if (!result.success) throw new Error(result.error);
  return result.rows;
}

async function getSDReferenceInfo(sdid, ulbId) {
  const sql = `
    SELECT 
      date_secdeposit_rectrnsdate AS rectrnsdate,
      num_secdeposit_rectrnsno AS rectrnsno, 
      CASE 
        WHEN num_secdeposit_recno IS NULL THEN num_secdeposit_vchno 
        ELSE num_secdeposit_recno 
      END AS recno 
    FROM aoac_secdeposit_def
    WHERE num_secdeposit_id = :sdid 
      AND num_secdepodet_ulbid = :ulbId
  `;

  const result = await executeQuery(sql, { sdid, ulbId });
  
  if (!result.success) throw new Error(result.error);
  return result.rows;
}


async function saveSdRefundVoucherRepo(payload) {
  console.log("📤 Repo: Execute SD Refund Voucher Procedure", payload);

  const sql = `
    BEGIN
      aoac_sdrefvchprep_ins(
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
    In_UserId: payload.userId,
    In_ParamStr: payload.paramStr,           // Master Data (delimited by ~)
    In_ParamStr2: payload.paramStr2, // Voucher Details (delimited by $ and #)
    In_ParamStr3: payload.paramStr3 , // Optional additional params
    In_ParamStr4: payload.paramStr4 , // SD Mapping Details (delimited by $ and #)
    In_ZoneId: payload.zoneId ,

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
module.exports = {
  searchPartiesConcatenated,
  searchPartiesStandard,
  getSdRefundList,
  getCreditGLMaster,
  getDebitGLMaster,
  checkRefundStatus,
  getVoucherBySDID,
  getSDVoucherMaster,
  getPartyBankDetails,
  getSDVoucherDetails,
  getVoucherPrepMaster,
  getGeneralBankDetails,
  getSDUpdatedDetails,
  getSDAccountSubtype,
  getPartyBankList,
  getBudgetBalance,
  getPartyTaxDetails,
  getSDVoucherPrepReceiptDetails,
  getSDReferenceInfo,
  saveSdRefundVoucherRepo,
};