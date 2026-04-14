const { executeQuery } = require("../../../db/queryExecutor");

const getTransactionTypes = async () => {
  const query = `
    SELECT 
      var_trnstype_trnstype,
      num_trnstype_trnstypeid
    FROM aoac_trnstype_def
    WHERE num_trnstype_trnstypeid IN (5,8,9)
  `;
  return executeQuery(query);
};

const getDepartments = async () => {
  const query = `
    SELECT 
      num_accdept_name,
      num_accdept_id
    FROM aoac_accdept_mst
  `;
  return executeQuery(query);
};

const getGLCodes = async () => {
  const query = `
    SELECT DISTINCT 
      num_glmaster_glcode || '-' || var_glmaster_glname AS glname,
      num_glmaster_glcode AS glcode
    FROM aoac_glmaster_def
    INNER JOIN aoac_accmaster_def 
      ON num_accmaster_glcode = num_glmaster_glcode
    ORDER BY num_glmaster_glcode
  `;
  return executeQuery(query);
};

const getBudgetHeads = async () => {
  const query = `
    SELECT 
      var_budgetconfig_budgetname,
      num_budgetconfig_headid
    FROM aoac_budgetconfig_det
    WHERE num_budgetconfig_level = 1
  `;
  return executeQuery(query);
};

const getPartyList = async (corpId) => {
  const query = `
    SELECT 
      num_partymst_partyid || '-' || var_partymst_partyname AS var_partymst_partyname,
      num_partymst_partyid
    FROM aoac_partymst_def
    WHERE num_partymst_ulbid = :corpId
    ORDER BY var_partymst_partyname
  `;
  return executeQuery(query, { corpId });
};

const getContraDetails = async (tranRef) => {
  const query = `
    SELECT *
    FROM view_contra_tran_Dtls
    WHERE tran_ref = :tranRef
  `;
  return executeQuery(query, { tranRef });
};

const getTransferList = async (zoneId, ulbId) => {
  const query = `
    SELECT 
      num_transfermst_refno AS refno,
      date_transfermst_trnsdate AS trnsdate,
      num_transfermst_vchno AS docno,
      var_trnstype_trnstypemar AS trnstype,
      zonemname AS zonename,
      var_grampanch_grampanch AS grampanch,
      SUM(num_transferdet_amt) AS amount,
      num_transfermst_insby AS username,
      date_transfermst_insdate AS datetime,
      num_transfermst_trnstypeid AS trnstypeid
    FROM aoac_transfermst_def
    INNER JOIN aoac_transferdet_def 
      ON num_transferdet_refno = num_transfermst_refno
    INNER JOIN aoac_trnstype_def 
      ON num_trnstype_trnstypeid = num_transfermst_trnstypeid
    INNER JOIN view_zone 
      ON zoneid = num_transfermst_zoneid
    LEFT JOIN aoac_grampanch_def 
      ON num_grampanch_deptid = num_transfermst_zoneid 
     AND num_grampanch_grampanchid = num_transfermst_grampanchid
    WHERE var_transfermst_authstatus IS NULL
      AND num_transferdet_amt > 0
      AND zoneid = :zoneId
      AND num_transfermst_ulbid = :ulbId
    GROUP BY 
      num_transfermst_refno,
      date_transfermst_trnsdate,
      num_transfermst_vchno,
      var_trnstype_trnstypemar,
      zonemname,
      var_grampanch_grampanch,
      num_transfermst_insby,
      date_transfermst_insdate,
      num_transfermst_trnstypeid
    ORDER BY num_transfermst_refno DESC
  `;
  return executeQuery(query, { zoneId, ulbId });
};

const transferInsertUpdate = async (userId, paramStr, paramStr2) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `BEGIN
         aoac_transfer_ins(
            :in_userid,
            :in_paramstr,
            :in_paramstr2,
            :out_returnstr,
            :out_errorcode,
            :out_errormsg
         );
       END;`,
      {
        in_userid: userId,
        in_paramstr: paramStr,
        in_paramstr2: paramStr2,

        out_returnstr: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 1000 },
        out_errorcode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        out_errormsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 1000 },
      }
    );

    return {
      errorCode: result.outBinds.out_errorcode,
      message: result.outBinds.out_errormsg,
      refNo: result.outBinds.out_returnstr,
    };

  } finally {
    if (connection) await connection.close();
  }
};


const creditLeasure = async (corp_id, glcode) => {
  const query = `
    SELECT 
      objectcode,
      objectcode || '-' || accname AS accname
    FROM accountview_web
    WHERE ulbid = :corp_id
      AND functioncode = :glcode
  `;
  return executeQuery(query, { corp_id, glcode });
};

module.exports = {
  getTransactionTypes,
  getDepartments,
  getGLCodes,
  getBudgetHeads,
  getPartyList,
  getContraDetails,
  getTransferList,
  transferInsertUpdate,
  creditLeasure
};