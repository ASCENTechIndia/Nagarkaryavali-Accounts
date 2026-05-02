
const repo = require("./FrmAccIntDataRpt.Repo");
const { AppError } = require("../../../libs/errors");

async function getDepartmentTransactionsService(body) {
  const { ulbid, status, deptId, fromDate, toDate } = body;

  if (!fromDate || !toDate) {
    throw new AppError("From Date and To Date are required", 400);
  }

  const result = await repo.getDepartmentTransactionsRepo({
    ulbid,
    status,
    deptId,
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


async function getCorporationService(body) {
  const result = await repo.getCorporationRepo(body);

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
  getDepartmentTransactionsService, getCorporationService
};
