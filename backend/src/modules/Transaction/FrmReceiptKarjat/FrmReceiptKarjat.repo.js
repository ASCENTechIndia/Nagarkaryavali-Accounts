const { executeQuery } = require("../../../db/queryExecutor");

const getReceiptTypes = async (ulbId) => {
  try {
    const query = `
      SELECT * FROM AOAC_RECEIPT_TYPE_MAS
      WHERE num_rec_type_ulbid = :ulbId 
    `;
    const result = await executeQuery(query, { ulbId });
    
    return result;
  } catch (err) {
    throw err;
  }
};

const getReceiptAccounts = async (recTypeId) => {
  try {
    const query = `
      SELECT 
        accountsearchname,
        num_recaccconfig_accno 
      FROM acccloud.aoac_REC_ACC_CONFIG
      INNER JOIN acccloud.accountview_web 
        ON glcode = num_recaccconfig_glcode 
       AND num_recaccconfig_accno = accno
      WHERE num_recaccconfig_rec_typeid = :recTypeId
    `;

    const result = await executeQuery(query, { recTypeId });
    
    return result;
  } catch (err) {
    throw err;
  }
};

const getBankAccounts = async (bankId) => {
  try {
    const query = `
      SELECT * FROM AOAC_BANKACC_MAS_DEF
      INNER JOIN acccloud.accountview_web 
              ON glcode =  num_bankaccmas_glcode
            AND num_bankaccmas_accno = accno
      WHERE num_bankaccmas_bankid = :bankId
    `;

    const result = await executeQuery(query, { bankId });
    
    return result;
  } catch (err) {
    throw err;
  }
};

const getPayModes = async () => {
  try {
    const query = `SELECT * FROM aoac_recmode_mas ORDER BY num_recmode_id`;
    const result = await executeQuery(query, {});
    return result;
  } catch (err) {
    throw err;
  }
};

const getPayModeAccounts = async (payModeId) => {
  try {
    const query = `
      select * from aoac_paymodeaccconf_def where num_paymodeaccconf_id = :payModeId
    `;
    const result = await executeQuery(query, { payModeId });
    return result;
  } catch (err) {
    throw err;
  }
};

const getAccountDetailsByAccNo = async (accno) => {
  try {
    const query = `
      SELECT 
        glcode AS vibhagcode,
        glcode || '-' || glname AS vibhagsanketank,
        objectcode AS lekhashirsh,
        accountsearchname AS lekhashirshname
      FROM accountview_web 
      WHERE accno = :accno
    `;
    const result = await executeQuery(query, { accno });
    return result;
  } catch (err) {
    throw err;
  }
};

const getBankBranchByIfsc = async (ifsc) => {
  try {
    const branchQuery = `
      SELECT 
        var_branchmst_branchname AS branchname, 
        num_branchmst_branchid AS branchid 
      FROM aoac_branchmst_def 
      INNER JOIN aoac_bankmst_def 
        ON num_branchmst_bankid = num_bankmst_bankid
      WHERE var_branchmst_ifsc = :ifsc
    `;
    const branchResult = await executeQuery(branchQuery, { ifsc });

    const bankQuery = `
      SELECT 
        var_bankmst_bankname AS bankname, 
        num_bankmst_bankid AS bankid 
      FROM aoac_bankmst_def 
      WHERE num_bankmst_bankid IN (
        SELECT num_branchmst_bankid 
        FROM aoac_branchmst_def 
        WHERE var_branchmst_ifsc = :ifsc
      )
    `;
    const bankResult = await executeQuery(bankQuery, { ifsc });

    return {
      branch: branchResult?.rows?.[0] || null,
      bank: bankResult?.rows?.[0] || null,
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getReceiptTypes,
  getReceiptAccounts,
  getBankAccounts,
  getPayModes,
  getPayModeAccounts,
  getAccountDetailsByAccNo,
  getBankBranchByIfsc
};