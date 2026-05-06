const repo = require("./FrmCheqCancelchanges.repo");
const { AppError } = require("../../../libs/errors");

async function getChequeCancelDetailsService(body) {
  const { fromDate, toDate, ulbId, transactionNo, chequeNo, amount, bankGl, bankAccNo } = body;

  if (!fromDate) throw new AppError("From Date is required", 400);
  if (!toDate) throw new AppError("To Date is required", 400);
  if (!ulbId) throw new AppError("ULBID is required", 400);

  const result = await repo.getChequeCancelDetails({
    fromDate,
    toDate,
    ulbId,
    transactionNo: transactionNo || null,
    chequeNo: chequeNo || null,
    amount: amount || null,
    bankGl: bankGl || null,
    bankAccNo: bankAccNo || null,
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

async function getChequeCancelDetailsServiceAuto(body) {
  const { ulbId, transNo, chequeNo } = body;

  if (!ulbId) throw new AppError("ULBID is required", 400);
  if (!transNo) throw new AppError("Transaction No is required", 400);
  if (!chequeNo) throw new AppError("Cheque No is required", 400);

  const result = await repo.getChequeCancelDetailsAuto({
    ulbId,
    transNo,
    chequeNo,
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

async function insertCheqCancelService(body) {
  const result = await repo.insertCheqCancelRepo(body);

  if (result.errorCode !== 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg || "Procedure execution failed", 400);
  }

  return {
    success: true,
    message: result.errorMsg,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
  };
}

module.exports = {
  getChequeCancelDetailsService, getChequeCancelDetailsServiceAuto, insertCheqCancelService
};
