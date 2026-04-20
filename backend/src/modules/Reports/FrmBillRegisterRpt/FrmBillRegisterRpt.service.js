const repo = require("./FrmBillRegisterRpt.repo");
const { AppError } = require("../../../libs/errors");

async function getBillRegisterReportService(body) {
  const { fromDate, toDate } = body;

  if (!fromDate) {
    throw new AppError("From Date is required", 400);
  }

  if (!toDate) {
    throw new AppError("To Date is required", 400);
  }

  const result = await repo.getBillRegisterReport({
    fromDate,
    toDate,
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
  getBillRegisterReportService,
};