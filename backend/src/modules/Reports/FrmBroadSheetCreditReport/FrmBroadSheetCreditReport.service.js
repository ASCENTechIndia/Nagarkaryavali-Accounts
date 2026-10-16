const repo = require("./FrmBroadSheetCreditReport.repo");
const { AppError } = require("../../../libs/errors");

const getBroadSheetCreditReportService = async ({ ulbId, yearId }) => {
  if (!ulbId) throw new AppError("ulbId required", 400);
  if (!yearId) throw new AppError("yearId required", 400);

  const data = await repo.getBroadSheetCreditReportData({ ulbId, yearId });

  if (!data.length) {
    throw new AppError("No Broad Sheet data found", 404);
  }

  return data;
};

module.exports = {
  getBroadSheetCreditReportService,
};