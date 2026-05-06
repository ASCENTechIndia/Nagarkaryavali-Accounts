const { executeProcedure } = require("../../../db/procedureExecutor");
const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");

async function getAccountDetailsRepo({ functionCode, ulbId, objectCode }) {
  console.log("📤 Repo: Fetch Account Details", {
    functionCode,
    ulbId,
    objectCode,
  });

  const sql = `
    SELECT 
        functioncode, 
        objectcode,
        var_accmaster_accname,
        num_accmaster_oldaccno AS oldaccno,
        num_accsubtypemst_accsubtypeid || '-' || var_accsubtypemst_accsubtype AS accsubtype 
    FROM aoac_accmaster_def
    INNER JOIN accountview_web 
        ON glcode = num_accmaster_glcode 
        AND accno = num_accmaster_accno 
        AND ulbid = num_accmaster_ulbid
    INNER JOIN aoac_accsubtypemaster_def 
        ON num_accsubtypemst_accsubtypeid = num_accmaster_accsubtype
    WHERE functioncode = :functionCode
      AND num_accmaster_ulbid = :ulbId
      AND objectcode = :objectCode
    ORDER BY functioncode
  `;

  const binds = {
    functionCode,
    ulbId,
    objectCode,
  };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function searchAccountRepo({ prefix, ulbId, functionCode }) {
  console.log("📤 Repo: Search Account", {
    prefix,
    ulbId,
    functionCode,
  });

  const sql = `
    SELECT 
        accsearchname,
        accno,
        functioncode,
        objectcode,
        accountsearchname 
    FROM accountview_web 
    WHERE 
        (objectcode LIKE :prefix OR accsearchname LIKE :prefix)
        AND ulbid = :ulbId
        ${functionCode ? "AND functioncode = :functionCode" : ""}
    ORDER BY accno
  `;

  const binds = {
    prefix: `%${prefix}%`,
    ulbId,
  };

  if (functionCode) {
    binds.functionCode = functionCode;
  }

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function searchGLRepo({ prefix }) {
  console.log("📤 Repo: Search GL", { prefix });

  const sql = `
    SELECT DISTINCT 
        glcode, 
        glsearchname, 
        glfunction 
    FROM view_glweb 
    WHERE 
        (TO_CHAR(glfunction) LIKE :prefix
         OR TRIM(UPPER(glsearchname)) LIKE TRIM(UPPER(:search)))
    ORDER BY glcode
  `;

  const binds = {
    prefix,
    search: `%${prefix}%`,
  };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getGLMasterListRepo() {
  console.log("📤 Repo: Fetch GL Master List");

  const sql = `
    SELECT 
      LPAD(num_glmaster_glcode, 3, '0') || '-' || var_glmaster_glname AS glname,
      LPAD(num_glmaster_glcode, 3, '0') AS glcode
    FROM aoac_glmaster_def
    ORDER BY LPAD(num_glmaster_glcode, 3, '0')
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getAccountTypeRepo() {
  console.log("📤 Repo: Fetch Account Types");

  const sql = `
    SELECT 
        num_acctypemaster_acctypeid, 
        var_acctypemaster_acctype 
    FROM aoac_acctypemaster_def
    ORDER BY num_acctypemaster_acctypeid
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getAccountSubTypeRepo() {
  console.log("📤 Repo: Fetch Account Subtypes");

  const sql = `
    SELECT 
      num_accsubtypemst_accsubtypeid || ' - ' || 
      var_accsubtypemast_grp2name || ' - ' || 
      var_accsubtypemast_grp3name || ' - ' || 
      var_accsubtypemast_grp4name AS var_accsubtypemst_accsubtype,
      num_accsubtypemst_accsubtypeid 
    FROM aoac_accsubtypemaster_def
    ORDER BY num_accsubtypemst_accsubtypeid
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getReportHeadsRepo({ reportCode }) {
  console.log("📤 Repo: Fetch Report Heads", { reportCode });

  const sql = `
    SELECT 
        num_reporthead_code, 
        var_reporthead_engname 
    FROM aoac_reportheads_mst 
    WHERE var_reporthead_reportcode = :reportCode
    ORDER BY num_reporthead_code
  `;

  const binds = {
    reportCode,
  };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getBankMasterRepo() {
  console.log("📤 Repo: Fetch Bank Master");

  const sql = `
    SELECT 
        num_bankmst_bankid, 
        var_bankmst_bankname 
    FROM aoac_bankmst_def
    ORDER BY num_bankmst_bankid
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getNidhiMasterRepo() {
  console.log("📤 Repo: Fetch Nidhi Master");

  const sql = `
    SELECT 
        num_nidhi_id, 
        var_nidhi_nidhiname 
    FROM aoac_nidhi_master
    ORDER BY num_nidhi_id
  `;

  const result = await executeQuery(sql);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getAccountFullDetailsRepo({ functionCode, accNo, ulbId }) {
  console.log("📤 Repo: Fetch Full Account Details", {
    functionCode,
    accNo,
    ulbId,
  });

  const sql = `
    SELECT 
        objectcode AS accno,
        var_accmaster_accname AS accname, 
        var_accmaster_accnameeng, 
        num_accsubtypemst_accsubtypeid AS acctypeid,  
        num_accmaster_accsubtype AS accsubtype, 
        num_accmaster_oldaccno AS oldaccno, 
        num_accmst_openbal AS openbal, 
        num_accmst_maxlimit AS maxlimit, 
        num_accmst_budgetamt AS budgetamt,
        num_accmaster_nidhiid AS nidhiid,
        num_accmst_revbudgetamt AS revbudgetamt,
        functioncode,
        objectcode,
        num_accmaster_ulbid
    FROM aoac_accmaster_def 
    INNER JOIN aoac_accsubtypemaster_def 
        ON num_accmaster_accsubtype = num_accsubtypemst_accsubtypeid 
    INNER JOIN accountview_web 
        ON glcode = num_accmaster_glcode 
        AND accno = num_accmaster_accno 
    WHERE functioncode = :functionCode
      AND objectcode = :accNo
      AND num_accmaster_ulbid = :ulbId
  `;

  const binds = {
    functionCode,
    accNo,
    ulbId,
  };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getAccountZoneDetailsRepo({ accId }) {
  console.log("📤 Repo: Fetch Account Zone Details", { accId });

  const sql = `
    SELECT 
        num_accmasterdet_zoneid AS zoneid,
        zonemname AS zonename,
        num_accmasterdet_openingbal AS openingbal 
    FROM aoac_accmasterdet_dtl  
    INNER JOIN view_zone 
        ON zoneid = num_accmasterdet_zoneid 
    WHERE num_accmasterdet_accid = :accId
    ORDER BY zoneid
  `;

  const binds = {
    accId,
  };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getAccountMappingDetailsRepo({ glCode, accNo }) {
  console.log("📤 Repo: Fetch Account Mapping Details", {
    glCode,
    accNo,
  });

  const sql = `
    SELECT 
        var_accmaster_accname AS accname, 
        var_accmaster_accnameeng, 
        num_accsubtypemst_accsubtypeid AS acctypeid, 
        num_accmaster_accsubtype AS accsubtype, 
        num_accmaster_oldaccno AS oldaccno,
        num_repheadsacc_balscode AS balscode, 
        num_repheadsacc_pnlcode AS pnlcode, 
        num_accmaster_glcode,
        num_accmaster_accno,
        num_accmaster_nidhiid 
    FROM aoac_accmaster_def
    INNER JOIN aoac_accsubtypemaster_def 
        ON num_accmaster_accsubtype = num_accsubtypemst_accsubtypeid 
    LEFT OUTER JOIN aoac_reportheadsacc_map 
        ON num_accmaster_glcode = num_repheadsacc_glcode 
        AND num_accmaster_accno = num_repheadsacc_accno 
    WHERE num_accmaster_glcode = :glCode
      AND num_accmaster_accno = :accNo
  `;

  const binds = {
    glCode,
    accNo,
  };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getNextAccountNoRepo({ ulbId, glCode, subTypeId }) {
  console.log("📤 Repo: Fetch Next Account Number", {
    ulbId,
    glCode,
    subTypeId,
  });

  const sql = `
    SELECT 
      LPAD(NVL(MAX(num_accno_lastno), 0) + 1, 4, '0') AS nextaccno
    FROM aoac_accno_config 
    WHERE num_accno_ulbid = :ulbId
      AND num_accno_glcode = :glCode
      AND num_accno_subtypeid = :subTypeId
  `;

  const binds = { ulbId, glCode, subTypeId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getZoneListRepo({ corpId }) {
  console.log("📤 Repo: Fetch Zone List", { corpId });

  const sql = `
    SELECT 
        zoneid,
        zonemname AS zonename  
    FROM view_zone  
    WHERE corpid = :corpId
    ORDER BY zoneid
  `;

  const binds = { corpId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function saveAccountMasterRepo(payload) {
  console.log("📤 Repo: Execute Account Master Procedure", payload);

  const sql = `
    BEGIN
      aoac_accmaster_ins(
        :in_ULBId,
        :in_glcode,
        :in_accno,
        :in_accname,
        :in_accnameeng,
        :in_UserId,
        :in_Mode,
        :in_subtypeid,
        :in_oldaccno,
        :in_nidhiid,
        :in_openingBal,
        :in_budgetAmt,
        :in_maxlimit,
        :in_revbudgetAmt,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_ULBId: payload.ulbId,
    in_glcode: payload.glCode,
    in_accno: payload.accNo,
    in_accname: payload.accName,
    in_accnameeng: payload.accNameEng,
    in_UserId: payload.userId,
    in_Mode: payload.mode,
    in_subtypeid: payload.subTypeId,
    in_oldaccno: payload.oldAccNo,
    in_nidhiid: payload.nidhiId,
    in_openingBal: payload.openingBal,
    in_budgetAmt: payload.budgetAmt,
    in_maxlimit: payload.maxLimit,
    in_revbudgetAmt: payload.revBudgetAmt,

    out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 500 },
  };

  const result = await executeProcedure({ sql, binds });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}

async function getFilteredAccSubTypeRepo({ accType, balanceSheetGroup }) {
  console.log("📤 Repo: Fetch Filtered Account SubTypes", {
    accType,
    balanceSheetGroup,
  });

  let subTypeCondition = "";

  // 🔹 Replicating your .NET logic
  if (accType == "1") {
    if (balanceSheetGroup == "4810") {
      subTypeCondition = "num_accsubtypemst_accsubtypeid IN (1)";
    } else if (balanceSheetGroup == "4820") {
      subTypeCondition = "num_accsubtypemst_accsubtypeid IN (2)";
    } else if (
      Number(balanceSheetGroup) >= 4400 &&
      Number(balanceSheetGroup) <= 4490
    ) {
      subTypeCondition = "num_accsubtypemst_accsubtypeid IN (17)";
    } else {
      subTypeCondition = "num_accsubtypemst_accsubtypeid IN (4)";
    }
  } else if (accType == "2") {
    if (balanceSheetGroup == "3351") {
      subTypeCondition = "num_accsubtypemst_accsubtypeid IN (16)";
    } else if (balanceSheetGroup == "3569") {
      subTypeCondition = "num_accsubtypemst_accsubtypeid IN (21)";
    } else {
      subTypeCondition = "num_accsubtypemst_accsubtypeid IN (27)";
    }
  } else if (accType == "3") {
    subTypeCondition = "num_accsubtypemst_accsubtypeid IN (29)";
  } else if (accType == "4") {
    subTypeCondition = "num_accsubtypemst_accsubtypeid IN (28)";
  }

  const sql = `
    SELECT 
      var_accsubtypemst_accsubtype,
      num_accsubtypemst_accsubtypeid 
    FROM aoac_accsubtypemaster_def 
    WHERE num_accsubtypemast_acctypeid = :accType
      AND ${subTypeCondition}
    ORDER BY num_accsubtypemst_accsubtypeid
  `;

  const binds = { accType };
  console.log("sql", sql)
  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


module.exports = {
  getAccountDetailsRepo,
  searchAccountRepo,
  searchGLRepo,
  getGLMasterListRepo,
  getAccountTypeRepo,
  getAccountSubTypeRepo,
  getReportHeadsRepo,
  getBankMasterRepo,
  getNidhiMasterRepo,
  getAccountFullDetailsRepo,
  getAccountZoneDetailsRepo,
  getAccountMappingDetailsRepo,
  getNextAccountNoRepo,
  getZoneListRepo,
  saveAccountMasterRepo,
  getFilteredAccSubTypeRepo
};
