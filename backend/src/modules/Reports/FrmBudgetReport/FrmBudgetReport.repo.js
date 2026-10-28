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
   WITH DCPS_DATA AS
(
    SELECT
        D.NUM_DCPS_ID AS DCPS_ID,
        N.NUM_DCPSNOGEN_ULBID AS ULBID,
        N.NUM_DCPSNOGEN_EMPID AS EMPLOYEE_ID,
        D.NUM_DCPS_SLIPID AS SLIP_ID,
        D.DAT_DCPS_SALDATE AS SALARY_DATE,
        D.VAR_DCPS_NAME AS EMPLOYEE_NAME,

        NVL(D.NUM_DCPS_EMPSHARE, 0) AS EMPLOYEE_CONTRIBUTION,
        NVL(D.NUM_DCPS_CORPSHARE, 0) AS ULB_CONTRIBUTION,

        D.NUM_DCPS_INTRESTPERC AS INTEREST_PERCENTAGE,
        D.NUM_DCPS_INTRESTAMOUNT AS INTEREST_AMOUNT,
        D.NUM_DCPS_CALCAMOUNT AS CALCULATED_AMOUNT,

        NVL(N.NUM_DCPSNOGEN_OPENINGBAL, 0)
            AS ORIGINAL_OPENING_BALANCE,

        N.VAR_DCPSNOGEN_DCPSNO AS DCPS_NUMBER,

        Y.NUM_YEAR_ID AS YEAR_ID,
        Y.VAR_YEAR AS YEAR

    FROM ACCCLOUD.AOAC_DCPSNOGEN_MAS N

    INNER JOIN ADMINS.AOMA_YEAR Y
        ON Y.NUM_YEAR_ID = :yearId

    LEFT JOIN ACCCLOUD.AOAC_DCPS_MAS D
        ON D.NUM_DCPS_ULBID = N.NUM_DCPSNOGEN_ULBID
       AND D.NUM_DCPS_EMPID = N.NUM_DCPSNOGEN_EMPID
       AND D.VAR_DCPS_DCPSNO = N.VAR_DCPSNOGEN_DCPSNO
       AND D.DAT_DCPS_SALDATE >=
           TO_DATE(Y.VAR_YEAR || '-01-01', 'YYYY-MM-DD')
       AND D.DAT_DCPS_SALDATE <
           ADD_MONTHS(
               TO_DATE(Y.VAR_YEAR || '-01-01', 'YYYY-MM-DD'),
               12
           )

    WHERE N.NUM_DCPSNOGEN_ULBID = :ulbId
      AND D.NUM_DCPS_SLIPID = :dcpsNo
),

DCPS_BALANCE AS
(
    SELECT
        DCPS_DATA.*,

        NVL(ORIGINAL_OPENING_BALANCE, 0)
        +
        NVL(
            SUM(
                NVL(EMPLOYEE_CONTRIBUTION, 0)
                + NVL(ULB_CONTRIBUTION, 0)
            ) OVER
            (
                PARTITION BY ULBID, EMPLOYEE_ID, DCPS_NUMBER
                ORDER BY SALARY_DATE NULLS FIRST, DCPS_ID
                ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
            ),
            0
        ) AS OPENING_BALANCE

    FROM DCPS_DATA
)

SELECT
    DCPS_ID,
    ULBID,
    EMPLOYEE_ID,
    SLIP_ID,
    SALARY_DATE,
    EMPLOYEE_NAME,
    EMPLOYEE_CONTRIBUTION,
    ULB_CONTRIBUTION,
    INTEREST_PERCENTAGE,
    INTEREST_AMOUNT,
    CALCULATED_AMOUNT,

    OPENING_BALANCE,

    -- Calculate interest using the opening balance of the individual row
 ROUND(
    (
        NVL(OPENING_BALANCE, 0)
        + NVL(EMPLOYEE_CONTRIBUTION, 0)
        + NVL(ULB_CONTRIBUTION, 0)
    )
    * NVL(INTEREST_PERCENTAGE, 0)
    / 100
    / 12,
    2
) AS INTEREST_AMOUNT,

    DCPS_NUMBER,
    YEAR_ID,
    YEAR

FROM DCPS_BALANCE

ORDER BY SALARY_DATE NULLS FIRST, DCPS_ID
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

async function getYearListRepo() {
  try {
    const query = `
      SELECT
        num_year_id,
        var_year
      FROM admins.aoma_year
      ORDER BY var_year
    `;

    const result = await executeQuery(query, {});
    return result.rows;
  } catch (err) {
    throw err;
  }
}
module.exports = {
  getBudgetReportData,
  getYearListRepo,
  getDcpsReportData
};
