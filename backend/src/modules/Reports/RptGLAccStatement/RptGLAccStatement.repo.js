const { executeQuery } = require("../../../db/queryExecutor");


async function getTransactionSummary(filters) {
  let params = {
    functioncode: filters.functioncode,
    objectcode: filters.objectcode,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };

  let sql = `
    SELECT
      trnsdate,

      SUM(
        CASE
          WHEN amount >= 0
          THEN amount
          ELSE 0
        END
      ) AS credit,

      SUM(
        CASE
          WHEN amount < 0
          THEN amount
          ELSE 0
        END
      ) AS debit,

      0 AS balance,

      'Cr.' AS crdrclose

    FROM transview a

    WHERE functioncode = :functioncode
    
        AND objectcode = :objectcode
  
      AND trnsdate BETWEEN
          TO_DATE(:fromDate, 'DD-MON-YYYY')
      AND TO_DATE(:toDate, 'DD-MON-YYYY')
  `;

  // ZONE FILTER
  if (filters.zoneid && filters.zoneid !== "-1") {
    sql += `
      AND zoneid = :zoneid
    `;
    params.zoneid = filters.zoneid;
  }

  sql += `
    GROUP BY trnsdate
    ORDER BY trnsdate
  `;
  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

// ================= DETAILS =================
async function getTransactionDetails(filters) {
  let params = {
    functioncode: filters.functioncode,
    objectcode: filters.objectcode ,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };

  let sql = `
    SELECT
      trnsdate,
      transno,
      narration,
      chqno,
      chqdate,

      CASE
        WHEN amount >= 0
        THEN amount
        ELSE 0
      END AS credit,

      CASE
        WHEN amount < 0
        THEN amount
        ELSE 0
      END AS debit,

      0 AS balance,

      'Cr.' AS crdr,

      docno

    FROM transview a

    WHERE functioncode = :functioncode

      AND        
         objectcode = :objectcode
    
      AND trnsdate BETWEEN
          TO_DATE(:fromDate, 'DD-MON-YYYY')
      AND TO_DATE(:toDate, 'DD-MON-YYYY')
  `;

  // ZONE FILTER
  if (filters.zoneid && filters.zoneid !== "-1") {
    sql += `
      AND zoneid = :zoneid
    `;

    params.zoneid = filters.zoneid;
  }

  sql += `
    ORDER BY trnsdate
  `;

  

  const result = await executeQuery(sql, params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

// ================= SEARCH ACCOUNT HEAD =================
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
        TO_CHAR(objectcode)
          LIKE :searchPrefix

        OR LOWER(
          TO_CHAR(objectcode)
          || '-' ||
          accname
        ) LIKE LOWER(:searchText)
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
