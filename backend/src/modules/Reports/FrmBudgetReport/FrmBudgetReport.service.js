const repo = require("./FrmBudgetReport.repo");
const { AppError } = require("../../../libs/errors");

const getBudgetReportService = async ({ ulbId }) => {
  if (!ulbId) throw new AppError("ulbId required", 400);

  const data = await repo.getBudgetReportData({ ulbId });

  if (!data.length) throw new AppError("No data found", 404);

  return data;
};

const getDcpsReportService = async ({ ulbId, dcpsNo,slipNo, yearId }) => {
  if (!ulbId) throw new AppError("ulbId required", 400);
  //if (!dcpsNo) throw new AppError("dcpsNo required", 400);
  if (!yearId) throw new AppError("yearId required", 400);
  if (!dcpsNo && !slipNo) throw new AppError("Either dcpsNo or slipNo is required", 400);

  const data = await repo.getDcpsReportData({
    ulbId,
    dcpsNo: dcpsNo || null,
    slipNo: slipNo || null,
    //slipNo,
    yearId,
  });

  if (!data.length) {
    throw new AppError("No DCPS data found", 404);
  }

  return data;
};

const getYearListService = () => {
  return repo.getYearListRepo();
};

module.exports = {
  getBudgetReportService,
  getDcpsReportService,
  getYearListService,

};