const repo = require("../FrmSdRefundRpt/FrmSdRefundRpt.Repo");
const { AppError } = require("../../../libs/errors");

async function getPartySearch1Service(body) {
  const { searchText, ulbid } = body;

  if (!searchText || !ulbid) {
    throw new AppError("searchText and ulbid are required", 400);
  }

  const result = await repo.getPartySearch1Repo({ searchText, ulbid });
  if (!result.success) throw new AppError(result.error, 500);

  return { success: true, rows: result.rows, rowCount: result.rows.length };
}

async function getPartySearch2Service(body) {
  const { searchText, ulbid } = body;

  if (!searchText || !ulbid) {
    throw new AppError("searchText and ulbid are required", 400);
  }

  const result = await repo.getPartySearch2Repo({ searchText, ulbid });
  if (!result.success) throw new AppError(result.error, 500);

  return { success: true, rows: result.rows, rowCount: result.rows.length };
}

async function getSDReceivedPaidService(body) {
  const { ulbid, recno, certino, partyname, partyid, fromDate, toDate } = body;

  if (!fromDate || !toDate || !ulbid) {
    throw new AppError("ulbid, fromDate and toDate are required", 400);
  }

  const result = await repo.getSDReceivedPaidRepo({
    ulbid,
    recno,
    certino,
    partyname,
    partyid,
    fromDate,
    toDate,
  });

  if (!result.success) throw new AppError(result.error, 500);

  return { success: true, rows: result.rows, rowCount: result.rows.length };
}

module.exports = {
  getPartySearch1Service,
  getPartySearch2Service,
  getSDReceivedPaidService,
};
