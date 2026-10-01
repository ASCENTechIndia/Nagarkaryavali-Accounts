const repo = require("./RptConsolidateReport.repo");
const { AppError } = require("../../../libs/errors");

async function getConsolidateChallanData(filters) {
  const { fromDate, toDate, ulbId } = filters;

  if (!fromDate || !toDate) {
    throw new AppError("fromDate and toDate are required", 400);
  }

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const data = await repo.getConsolidateChallanData({
    fromDate,
    toDate,
    ulbId
  });

  return data;
}

module.exports = {
  getConsolidateChallanData,
};