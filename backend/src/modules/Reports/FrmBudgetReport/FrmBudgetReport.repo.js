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
const getDcpsReportData = async ({ ulbId, dcpsNo, yearId }) => {
  const query = `
    SELECT
      D.NUM_DCPS_ID AS DCPS_ID,
      D.NUM_DCPS_ULBID AS ULBID,
      D.NUM_DCPS_EMPID AS EMPLOYEE_ID,
      D.NUM_DCPS_SLIPID AS SLIP_ID,
      D.DAT_DCPS_SALDATE AS SALARY_DATE,
      D.VAR_DCPS_NAME AS EMPLOYEE_NAME,
      D.NUM_DCPS_EMPSHARE AS EMPLOYEE_CONTRIBUTION,
      D.NUM_DCPS_CORPSHARE AS ULB_CONTRIBUTION,
      D.NUM_DCPS_INTRESTPERC AS INTEREST_PERCENTAGE,
      D.NUM_DCPS_INTRESTAMOUNT AS INTEREST_AMOUNT,
      D.NUM_DCPS_CALCAMOUNT AS CALCULATED_AMOUNT,
      D.NUM_DCPS_OPENINGBAL AS OPENING_BALANCE,
      D.VAR_DCPS_DCPSNO AS DCPS_NUMBER,
      Y.NUM_YEAR_ID AS YEAR_ID,
      Y.VAR_YEAR AS YEAR
    FROM ACCCLOUD.AOAC_DCPS_MAS D
    INNER JOIN ADMINS.AOMA_YEAR Y
      ON Y.NUM_YEAR_ID = :yearId
    WHERE D.NUM_DCPS_ULBID = :ulbId
      AND D.VAR_DCPS_DCPSNO = :dcpsNo
      AND D.DAT_DCPS_SALDATE >= TO_DATE(Y.VAR_YEAR || '-01-01', 'YYYY-MM-DD')
      AND D.DAT_DCPS_SALDATE < ADD_MONTHS(
            TO_DATE(Y.VAR_YEAR || '-01-01', 'YYYY-MM-DD'),
            12
          )
    ORDER BY D.DAT_DCPS_SALDATE
  `;

  const result = await executeQuery(query, {
    ulbId,
    dcpsNo,
    yearId,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
};
module.exports = {
  getBudgetReportData,
  getDcpsReportData
};
