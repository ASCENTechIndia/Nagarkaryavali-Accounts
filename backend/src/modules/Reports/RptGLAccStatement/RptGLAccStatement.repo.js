const { executeQuery } = require("../../../db/queryExecutor");

async function getTransactionSummary(filters) {
  let params = {
    functioncode: filters.functioncode,
    objectcode: filters.objectcode || null,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    zoneid:
      filters.zoneid && filters.zoneid !== "-1"
        ? filters.zoneid
        : null,
  };

  const sql = `
    SELECT
      trnsdate,
      SUM(CASE WHEN amount >= 0 THEN amount ELSE 0 END) AS credit,
      SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) AS debit,
      0 AS balance,
      'Cr.' AS crdrclose
    FROM transview a
    WHERE functioncode = :functioncode
      AND (:objectcode IS NULL OR objectcode = :objectcode)
      AND trnsdate BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY')
                       AND TO_DATE(:toDate, 'DD-MON-YYYY')
      AND (:zoneid IS NULL OR zoneid = :zoneid)
    GROUP BY trnsdate
    ORDER BY trnsdate
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getTransactionDetails(filters) {
  let params = {
    functioncode: filters.functioncode,
    objectcode: filters.objectcode || null,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    zoneid:
      filters.zoneid && filters.zoneid !== "-1"
        ? filters.zoneid
        : null,
  };

  const sql = `
    SELECT
      trnsdate,
      transno,
      narration,
      chqno,
      chqdate,
      CASE
        WHEN amount >= 0 THEN amount
        ELSE 0
      END AS credit,
      CASE
        WHEN amount < 0 THEN amount
        ELSE 0
      END AS debit,
      0 AS balance,
      'Cr.' AS crdr,
      docno
    FROM transview a
    WHERE functioncode = :functioncode
      AND (:objectcode IS NULL OR objectcode = :objectcode)
      AND trnsdate BETWEEN TO_DATE(:fromDate, 'DD-MON-YYYY')
                       AND TO_DATE(:toDate, 'DD-MON-YYYY')
      AND (:zoneid IS NULL OR zoneid = :zoneid)
    ORDER BY trnsdate
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


// ================= SEARCH ACCOUNT HEAD REPOSITORY =================

async function searchAccountHead(filters) {
  const params = {
    ulbId: Number(filters.ulbId),
    functionCode: Number(filters.functionCode),
    searchPrefix: `${filters.prefix}%`,
    searchText: `%${filters.prefix}%`,
  };

  const sql = `
    SELECT
      objectcode,
      objectcode || '-' || accname AS accname
    FROM accountview_web
    WHERE ulbid = :ulbId
      AND functioncode = :functionCode
      AND (
            TO_CHAR(objectcode) LIKE :searchPrefix
            OR LOWER(TO_CHAR(objectcode) || '-' || accname)
               LIKE LOWER(:searchText)
          )
    ORDER BY objectcode
  `;

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows.map((row) => ({
    OBJECTCODE: row.OBJECTCODE,
    ACCNAME: row.ACCNAME,
  }));
}

module.exports = {
  getTransactionSummary,
  getTransactionDetails,
  searchAccountHead,
};