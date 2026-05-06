const repo = require("./FrmChequeUpdateRpt.repo");
const { AppError } = require("../../../libs/errors");

async function getChequeUpdateReportService(body) {
  const { ulbId, bankGl, bankAccNo, chequeFrom, chequeTo } = body;

  if (!ulbId) throw new AppError("ULBID is required", 400);
  if (!bankGl) throw new AppError("Bank GL is required", 400);
  if (!bankAccNo) throw new AppError("Bank Account No is required", 400);

  const result = await repo.getChequeUpdateReport({
    ulbId,
    bankGl,
    bankAccNo,
    chequeFrom: chequeFrom || null,
    chequeTo: chequeTo || null,
  });

  if (!result.success) {
    throw new AppError(result.error, 500);
  }

  return {
    success: true,
    rows: result.rows,
    rowCount: result.rows.length,
  };
}

module.exports = {
  getChequeUpdateReportService,
};
