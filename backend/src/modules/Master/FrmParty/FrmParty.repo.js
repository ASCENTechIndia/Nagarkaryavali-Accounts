const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

async function getCorporationList() {
  const sql = `
    SELECT var_corporation_name, num_corporation_id
    FROM admins.aoma_corporation_mas
    ORDER BY num_corporation_id
  `;

  const result = await executeQuery(sql);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function searchParty(partyId, corpId) {
  let sql = `
    SELECT  
      P.num_partymst_partyid AS partyId,
      P.var_partymst_partyname AS partyName,
      P.num_partymst_pinno,
      P.num_partymst_mobno,
      P.var_partymst_email,
      P.var_partymst_city,
      P.var_partymst_pancard,
      P.var_partymst_gstno
    FROM aoac_partymst_def P
    WHERE P.num_partymst_ulbid = :corpId
  `;
  
  const params = { corpId };
  
  if (partyId) {
    sql += ` AND P.num_partymst_partyid = :partyId`;
    params.partyId = partyId;
  }
  
  sql += ` ORDER BY P.num_partymst_partyid`;

  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getPincodeList(corpId) {
  const sql = `
    SELECT to_char(num_pincode_pinno) AS num_pincode_pinno,
           num_pincode_id
    FROM aoac_pincode_def
    WHERE num_pincode_ulbid = :corpId
  `;

  const result = await executeQuery(sql, { corpId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getIFSCList(corpId) {
  const sql = `
    SELECT to_char(var_ifsc_ifccode) AS var_ifsc_ifccode,
           num_ifsc_id
    FROM aoac_ifsc_def
    WHERE num_ifsc_ulbid = :corpId
  `;

  const result = await executeQuery(sql, { corpId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getPartyById(partyId) {
  const sql = `
    SELECT *
    FROM AOAC_PARTYMST_DEF
    WHERE num_partymst_partyid = :partyId
  `;

  const result = await executeQuery(sql, { partyId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getPartyBankDetails(partyId) {
  const sql = `
    SELECT 
      num_partybank_id PartyBankDtlsId,
      NUM_PARTYBANK_BANKID BankId,
      var_bankmst_bankname BankName,
      NUM_PARTYBANK_BRANCHID BranchId,
      var_branchmst_branchname BranchName,
      VAR_PARTYBANK_IFSC IFSCCode,
      VAR_PARTYBANK_ACCOUNTNO AccountNo,
      VAR_PARTYBANK_STATUS Status,
      NVL(num_partybank_micr, 0) micr
    FROM aoac_partybank_dtls
    INNER JOIN aoac_bankmst_def 
      ON NUM_PARTYBANK_BANKID = num_bankmst_bankid
    INNER JOIN aoac_branchmst_def 
      ON NUM_PARTYBANK_BRANCHID = num_branchmst_branchid
    WHERE num_partybank_partyid = :partyId
  `;

  const result = await executeQuery(sql, { partyId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getStateList() {
  const sql = `
    SELECT num_statemst_stateid AS value,
           var_statemst_statename AS label
    FROM aoac_statemst_def
    ORDER BY var_statemst_statename
  `;

  const result = await executeQuery(sql);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getBankList() {
  const sql = `
    SELECT num_bankmst_bankid AS value,
           var_bankmst_bankname AS label
    FROM aoac_bankmst_def
    ORDER BY var_bankmst_bankname
  `;

  const result = await executeQuery(sql);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getDistrictByState(stateId) {
  const sql = `
    SELECT num_districtmst_districtid AS value,
           var_districtmst_districtname AS label
    FROM aoac_districtmst_def
    WHERE num_districtmst_stateid = :stateId
    ORDER BY var_districtmst_districtname
  `;

  const result = await executeQuery(sql, { stateId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getCityByDistrict(districtId) {
  const sql = `
    SELECT num_citymst_cityid AS value,
           var_citymst_cityname AS label
    FROM aoac_citymst_def
    WHERE num_citymst_districtid = :districtId
    ORDER BY var_citymst_cityname
  `;

  const result = await executeQuery(sql, { districtId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getBranchByBank(bankId) {
  const sql = `
    SELECT num_branchmst_branchid AS value,
           var_branchmst_branchname AS label
    FROM aoac_branchmst_def
    WHERE num_branchmst_bankid = :bankId
    ORDER BY var_branchmst_branchname
  `;

  const result = await executeQuery(sql, { bankId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getIFSCByBranch(branchId) {
  const sql = `
    SELECT var_branchmst_ifsc
    FROM aoac_branchmst_def
    WHERE num_branchmst_branchid = :branchId
  `;

  const result = await executeQuery(sql, { branchId });
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function partyMasterProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
            aoac_party_ins_v1(
              :in_partyid,
              :in_partyname,
              :in_propname,
              :in_partyadd,
              :in_cityid,
              :in_pinno,
              :in_mobno,
              :in_email,
              :in_panno,
              :in_bstno,
              :in_mstno,
              :in_vat,
              :in_bankid,
              :in_branchid,
              :in_ifscode,
              :in_Accno,
              :in_UserId,
              :in_Mode,
              :in_GSTNumber,
              :in_BankStr,
              :in_District,
              :in_Aadharno,
              :in_ULBID,
              :in_ipaddress,
              :in_source,
              :out_ErrorCode,
              :out_ErrorMsg
            );
         END;`,
        {
          in_partyid: data.partyId || null,
          in_partyname: data.partyName,
          in_propname: data.propName || null,
          in_partyadd: data.partyAddress || null,
          in_cityid: data.cityId || null,
          in_pinno: data.pinNo || null,
          in_mobno: data.mobNo || null,
          in_email: data.email || null,
          in_panno: data.panNo || null,
          in_bstno: data.bstNo || null,
          in_mstno: data.mstNo || null,
          in_vat: data.vatNo || null,
          in_bankid: data.bankId || null,
          in_branchid: data.branchId || null,
          in_ifscode: data.ifscCode || null,
          in_Accno: data.accountNo || null,
          in_UserId: data.userId,
          in_Mode: data.mode, // 1=Insert, 2=Update, 3=Delete
          in_GSTNumber: data.gstNumber || null,
          in_BankStr: data.bankStr || null,
          in_District: data.districtId || null,
          in_Aadharno: data.aadharNo || null,
          in_ULBID: data.corpId,
          in_ipaddress: data.ipAddress || null,
          in_source: data.source || null,
          out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
          },
          out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 2000
          }
        }
      );

      return res.outBinds;
    });

    return {
      success: true,
      errorCode: result.OUT_ERRORCODE,
      errorMsg: result.OUT_ERRORMSG
    };

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}


module.exports = {
  getCorporationList,
  searchParty,
  getPincodeList,
  getIFSCList,
  getPartyById,
  getPartyBankDetails,
  getStateList,
  getBankList,
  getDistrictByState,
  getCityByDistrict,
  getBranchByBank,
  getIFSCByBranch,
  partyMasterProc
};