const repo = require("./RptTrialBalance.repo");
const { AppError } = require("../../../libs/errors");

const getTrialBalanceService = async ({ fromDate, toDate, corp_id }) => {
  if (!fromDate || !toDate) {
    throw new AppError("FromDate and ToDate required", 400);
  }

  const data = await repo.getTrialBalance({ fromDate, toDate, corp_id });

  if (!data.length) {
    throw new AppError("No records found", 404);
  }

  const formatted = data.map((row) => {
    let opening = Math.abs(Number(row.OPENINGBAL || 0));
    let credit = Math.abs(Number(row.CREDIT || 0));
    let debit = Math.abs(Number(row.DEBIT || 0));

    let closing = opening + (credit + debit);

    return {
      ...row,
      OPENINGBAL: opening,
      CREDIT: credit,
      DEBIT: debit,
      CLOSINGBAL: closing,
      OPENINGCRDR: row.OPENINGBAL >= 0 ? "Cr." : "Dr.",
      CLOSINGCRDR: closing >= 0 ? "Cr." : "Dr.",
    };
  });

  return {
    success: true,
    list: formatted,
  };
};

module.exports = {
  getTrialBalanceService,
};