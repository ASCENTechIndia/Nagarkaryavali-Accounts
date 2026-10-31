const { executeQuery } = require("../../../db/queryExecutor");

const getBroadSheetCreditReportData = async ({ ulbId, yearId }) => {
  const startYear = Number(yearId);

  if (!Number.isInteger(startYear) || startYear < 1900 || startYear > 9998) {
    throw new Error("Invalid financial year");
  }

  const query = `
    SELECT
      D.NUM_DCPS_EMPID AS ACCOUNT_NO,
      D.VAR_DCPS_DCPSNO AS DCPS_NO,
      D.VAR_DCPS_NAME AS DCPS_NAME,
      D.NUM_DCPS_SLIPID AS SLIP_ID,

      NVL(MAX(D.NUM_DCPS_OPENINGBAL), 0) AS OPENING_BALANCE,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-04-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-05-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS APR_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-05-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-06-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS MAY_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-06-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-07-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS JUN_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-07-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-08-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS JUL_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-08-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-09-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS AUG_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-09-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-10-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS SEP_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-10-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-11-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS OCT_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-11-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-12-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS NOV_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-12-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE < TO_DATE((:yearId + 1) || '-01-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS DEC_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE((:yearId + 1) || '-01-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE < TO_DATE((:yearId + 1) || '-02-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS JAN_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE((:yearId + 1) || '-02-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE < TO_DATE((:yearId + 1) || '-03-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS FEB_AMOUNT,

      SUM(CASE
        WHEN D.DAT_DCPS_SALDATE >= TO_DATE((:yearId + 1) || '-03-01', 'YYYY-MM-DD')
         AND D.DAT_DCPS_SALDATE < TO_DATE((:yearId + 1) || '-04-01', 'YYYY-MM-DD')
        THEN NVL(D.NUM_DCPS_EMPSHARE, 0) + NVL(D.NUM_DCPS_CORPSHARE, 0)
        ELSE 0
      END) AS MAR_AMOUNT,

      SUM(NVL(D.NUM_DCPS_INTRESTAMOUNT, 0)) AS YEAR_END_INTEREST,

      NVL(MAX(D.NUM_DCPS_OPENINGBAL), 0)
        + SUM(NVL(D.NUM_DCPS_EMPSHARE, 0))
        + SUM(NVL(D.NUM_DCPS_CORPSHARE, 0))
        + SUM(NVL(D.NUM_DCPS_INTRESTAMOUNT, 0)) AS TOTAL_BALANCE

    FROM AOAC_DCPS_MAS D

    WHERE D.NUM_DCPS_ULBID = :ulbId
      AND D.DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-04-01', 'YYYY-MM-DD')
      AND D.DAT_DCPS_SALDATE < TO_DATE((:yearId + 1) || '-04-01', 'YYYY-MM-DD')
      AND D.VAR_DCPS_DCPSNO IS NOT NULL

    GROUP BY
      D.NUM_DCPS_EMPID,
      D.VAR_DCPS_DCPSNO,
      D.VAR_DCPS_NAME,
      D.NUM_DCPS_SLIPID

    ORDER BY D.NUM_DCPS_EMPID
  `;

  const result = await executeQuery(query, {
    ulbId,
    yearId: startYear,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
};

module.exports = {
  getBroadSheetCreditReportData,
};