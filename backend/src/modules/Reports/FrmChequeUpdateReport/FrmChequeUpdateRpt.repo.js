const { executeQuery } = require("../../../db/queryExecutor");

async function getChequeUpdateReport(params) {
  const query = `
    SELECT * 
    FROM VW_ChequeupdateReportlist 
    WHERE ULBID = :ulbId
      AND bankgl = :bankGl
      AND bankacno = :bankAccNo
      AND (:chequeFrom IS NULL OR cheqno >= :chequeFrom)
      AND (:chequeTo IS NULL OR cheqno <= :chequeTo)
    ORDER BY cheqno
  `;

  return await executeQuery(query, params);
}

module.exports = {
  getChequeUpdateReport,
};
