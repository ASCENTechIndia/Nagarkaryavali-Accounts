const { executeQuery } = require("../../../db/queryExecutor");

const getBudgetReportData = async ({ ulbId }) => {
  const query = `
    SELECT 
      num_acctypemaster_acctypeid G1,
      var_acctypemaster_acctype G1Name,

      num_accsubtypemast_grp2 G2,
      var_accsubtypemast_grp2name G2Name,

      num_accsubtypemast_grp3 G3,
      var_accsubtypemast_grp3name G3Name,

      num_accsubtypemast_grp4 G4,
      var_accsubtypemast_grp4name G4Name,

      num_accsubtypemst_accsubtypeid AccCode,
      var_accsubtypemst_accsubtype AccCodeName,

      num_accmaster_glcode GlCode,
      var_glmaster_glname Glname,

      num_accmaster_accno AccNo,
      var_accmaster_accname AccName,

      num_accmst_budgetamt budgetamt,
      num_accmst_revbudgetamt revbudgetamt,

      NVL(num_accmasterdet_currentbal,0) currbal,

      var_accmst_function glfunction,
      var_accmst_function|| var_accmst_object || var_accmst_accid accobject

    FROM aoac_accmaster_def
    INNER JOIN aoac_glmaster_def 
      ON num_glmaster_glcode = num_accmaster_glcode

    INNER JOIN aoac_accsubtypemaster_def 
      ON num_accsubtypemst_accsubtypeid = num_accmaster_accsubtype  

    INNER JOIN aoac_acctypemaster_def 
      ON num_acctypemaster_acctypeid = num_accsubtypemast_acctypeid

    WHERE num_accmaster_ulbid = :ulbId
  `;

  const result = await executeQuery(query, { ulbId });

  if (!result.success) throw new Error(result.error);

  return result.rows;
};

module.exports = {
  getBudgetReportData,
};
