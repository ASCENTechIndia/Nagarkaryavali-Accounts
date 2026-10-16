const { executeQuery } = require("../../../db/queryExecutor");

const getBroadSheetCreditReportData = async ({ ulbId, yearId }) => {
  const query = `
    SELECT
      NUM_DCPS_EMPID AS ACCOUNT_NO,
      MAX(NUM_DCPS_OPENINGBAL) AS OPENING_BALANCE,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-04-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-05-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS APR_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-05-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-06-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS MAY_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-06-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-07-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS JUN_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-07-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-08-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS JUL_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-08-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-09-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS AUG_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-09-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-10-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS SEP_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-10-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-11-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS OCT_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-11-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE(:yearId || '-12-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS NOV_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-12-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE((:yearId + 1) || '-01-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS DEC_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE((:yearId + 1) || '-01-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE((:yearId + 1) || '-02-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS JAN_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE((:yearId + 1) || '-02-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE((:yearId + 1) || '-03-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS FEB_AMOUNT,

      SUM(CASE
          WHEN DAT_DCPS_SALDATE >= TO_DATE((:yearId + 1) || '-03-01', 'YYYY-MM-DD')
           AND DAT_DCPS_SALDATE <  TO_DATE((:yearId + 1) || '-04-01', 'YYYY-MM-DD')
          THEN NVL(NUM_DCPS_CALCAMOUNT, 0)
          ELSE 0
      END) AS MAR_AMOUNT,

      SUM(NVL(NUM_DCPS_INTRESTAMOUNT, 0)) AS YEAR_END_INTEREST,

      NVL(MAX(NUM_DCPS_OPENINGBAL), 0)
        + SUM(NVL(NUM_DCPS_CALCAMOUNT, 0))
        + SUM(NVL(NUM_DCPS_INTRESTAMOUNT, 0)) AS TOTAL_BALANCE

    FROM AOAC_DCPS_MAS

    WHERE NUM_DCPS_ULBID = :ulbId
      AND DAT_DCPS_SALDATE >= TO_DATE(:yearId || '-04-01', 'YYYY-MM-DD')
      AND DAT_DCPS_SALDATE <  TO_DATE((:yearId + 1) || '-04-01', 'YYYY-MM-DD')

    GROUP BY NUM_DCPS_EMPID
    ORDER BY NUM_DCPS_EMPID
  `;

  const result = await executeQuery(query, {
    ulbId,
    yearId: String(yearId),
  });

  if (!result.success) throw new Error(result.error);

  return result.rows;
};

module.exports = {
  getBroadSheetCreditReportData,
};