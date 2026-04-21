const repo = require("./RptPaymentRegister.repo");
const { AppError } = require("../../../libs/errors");

const getPaymentRegisterService = async (payload) => {
  return await repo.getPaymentRegister(payload);
};


async function getPaymentRegisterReportService(body) {
  const { fromDate, toDate } = body;

  if (!fromDate) throw new AppError("From Date is required", 400);
  if (!toDate) throw new AppError("To Date is required", 400);

  const result = await repo.getPaymentRegisterReport(body);

  if (!result.success) {
    throw new AppError(result.error, 500);
  }

  return {
    success: true,
    rows: result.rows,
    rowCount: result.rows.length,
  };
}


module.exports = { getPaymentRegisterService, getPaymentRegisterReportService };