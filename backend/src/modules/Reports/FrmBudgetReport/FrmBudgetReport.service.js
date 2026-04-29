const repo = require("./FrmBudgetReport.repo");
const { AppError } = require("../../../libs/errors");

const getBudgetReportService = async ({ ulbId }) => {
  if (!ulbId) throw new AppError("ulbId required", 400);

  const data = await repo.getBudgetReportData({ ulbId });

  if (!data.length) throw new AppError("No data found", 404);

  return data;
};

module.exports = {
  getBudgetReportService,
};