const { executeQuery } = require("../../../db/queryExecutor");

const getTrialBalance = async ({ fromDate, toDate, corp_id }) => {
  const query = `
    SELECT 
      a.glcode,
      a.glname,
      a.accno,
      a.accname,
      functioncode,
      objectcode,
      accountsearchname,

      NVL(a.openingbal, 0) +
      NVL((
        SELECT SUM(c.amount) 
        FROM transview c 
        WHERE c.trnsdate < TO_DATE(:fromDate,'DD-MM-YYYY')
          AND c.glcode = a.glcode 
          AND c.accno = a.accno
      ), 0) AS openingbal,

      '' AS openingcrdr,

      NVL((
        SELECT SUM(d.amount) 
        FROM transview d 
        WHERE d.trnsdate BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY') 
                             AND TO_DATE(:toDate,'DD-MM-YYYY')
          AND d.glcode = a.glcode 
          AND d.accno = a.accno 
          AND d.amount > 0
      ), 0) AS credit,

      NVL((
        SELECT SUM(e.amount) 
        FROM transview e 
        WHERE e.trnsdate BETWEEN TO_DATE(:fromDate,'DD-MM-YYYY') 
                             AND TO_DATE(:toDate,'DD-MM-YYYY')
          AND e.glcode = a.glcode 
          AND e.accno = a.accno 
          AND e.amount < 0
      ), 0) AS debit,

      0 AS closingbal,
      '' AS closingcrdr

    FROM accountview_web a
    WHERE a.ulbid = :corp_id
  `;

  const result = await executeQuery(query, {
    fromDate,
    toDate,
    corp_id,
  });

  if (!result.success) throw new Error(result.error);

  return result.rows;
};

module.exports = {
  getTrialBalance,
};