const repo = require("./FrmChequeBook.repo");
const { AppError } = require("../../../libs/errors");

const getChequeBookReport = async (payload) => {
  const {
    majorCode,
    bankAcc,
    chequeFrom,
    chequeTo,
  } = payload;

  // 🔴 VALIDATIONS (same as .NET)
  if (!majorCode) throw new AppError("Credit GL is required", 400);
  if (!bankAcc) throw new AppError("Credit Account is required", 400);

  if (chequeFrom && chequeTo && Number(chequeFrom) > Number(chequeTo)) {
    throw new AppError("Cheque From cannot be greater than To", 400);
  }

  if (!chequeFrom && chequeTo) {
    throw new AppError("Cheque From is required", 400);
  }

  if (chequeFrom && !chequeTo) {
    throw new AppError("Cheque To is required", 400);
  }

  const data = await repo.getChequeBookData(payload);

  if (!data.length) throw new AppError("No data found", 404);

  return data;
};

module.exports = {
  getChequeBookReport,
};