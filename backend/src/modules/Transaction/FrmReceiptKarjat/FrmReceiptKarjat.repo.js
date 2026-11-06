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

const getReceiptListKarjat = async ({
  ulbId,
  userId,
}) => {
  const query = `
    SELECT
        rmst.num_receiptmst_refno AS refno,
        rmst.date_receiptmst_trnsdate AS trnsdate,
        rmst.num_receiptmst_recno AS docno,

        tt.var_trnstype_trnstypemar AS trnstype,

        vz.zoneename AS zonename,

        gp.var_grampanch_grampanch AS grampanch,

        rd.num_receiptother_refno AS otherrefno,
        rd.num_receiptother_recno AS otherrecno,
        rd.num_receiptother_rectypeid AS otherrectypeid,
        rd.var_receiptother_from AS otherreceipt,
        rd.var_receiptother_email AS otherreceiptno,
        rd.num_receiptother_mobno AS othermobileno,
        rd.num_receiptother_anudanno AS otheranudanno,
        rd.num_receiptother_recmodeid AS otherrecmodeid,
        rd.num_receiptother_bankid AS otherbankid,
        rd.num_receiptother_branchid AS otherbranchid,
        rd.var_receiptother_chequeno AS otherreceiptchequeno,
        rd.date_receiptother_chequedate AS otherchequedate,
        rd.var_receiptother_insby AS otherreciptins,

        NVL(det.total_amount, 0)
        - NVL(rdesc.discount_amount, 0) AS amount,

        rmst.var_receiptmst_insby AS username,
        rmst.date_receiptmst_insdate AS datetime,
        rmst.num_receiptmst_trnstypeid AS trnstypeid,

        0 AS budgetcode,

        NVL(rdesc.discount_amount, 0) AS discountamount

    FROM aoac_receiptmst_def rmst

    LEFT JOIN (
        SELECT
            num_receiptdet_refno,
            SUM(num_receiptdet_amount) total_amount
        FROM aoac_receiptdet_def
        GROUP BY num_receiptdet_refno
    ) det
      ON det.num_receiptdet_refno =
         rmst.num_receiptmst_refno

    INNER JOIN aoac_trnstype_def tt
      ON tt.num_trnstype_trnstypeid =
         rmst.num_receiptmst_trnstypeid

    INNER JOIN view_zone vz
      ON vz.zoneid =
         rmst.num_receiptmst_zoneid

    INNER JOIN aoac_receiptother_def rd
      ON rd.num_receiptother_refno =
         rmst.num_receiptmst_refno

    LEFT JOIN aoac_grampanch_def gp
      ON gp.num_grampanch_deptid =
         rmst.num_receiptmst_zoneid
     AND gp.num_grampanch_grampanchid =
         rmst.num_receiptmst_grampanchid

    LEFT JOIN (
        SELECT
            num_receiptdesc_refno,
            SUM(num_receiptdesc_amount) discount_amount
        FROM aoac_receiptdesc_def
        GROUP BY num_receiptdesc_refno
    ) rdesc
      ON rdesc.num_receiptdesc_refno =
         rmst.num_receiptmst_refno

    WHERE rmst.var_receiptmst_authstatus IS NULL
      AND rmst.num_receiptmst_ulbid = :ulbId
      AND rmst.var_receiptmst_insby = :userId

    ORDER BY rmst.num_receiptmst_refno
  `;

  const bindParams = {
    ulbId: Number(ulbId),
    userId,
  };

  return await executeQuery(query, bindParams);
};

module.exports = {
  getReceiptTypes,
  getReceiptAccounts,
  getBankAccounts,
  getPayModes,
  getPayModeAccounts,
  getAccountDetailsByAccNo,
  getBankBranchByIfsc,
  getReceiptListKarjat
};