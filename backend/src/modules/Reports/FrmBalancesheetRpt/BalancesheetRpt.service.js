const repo = require("./BalancesheetRpt.repo");
const { AppError } = require("../../../libs/errors");



const getBalanceSheetPDF = async ({ fromDate, corp_id, type }) => {
  if (!fromDate) throw new AppError("FromDate required", 400);

  let data;

  if (type === "0") {
    data = await repo.getBalanceSheetSummary({ fromDate, corp_id });
  } else {
    data = await repo.getBalanceSheetDetails({ fromDate, corp_id });
  }

  if (!data.length) throw new AppError("No data found", 404);

  return data;
};


module.exports = {
  getBalanceSheetPDF,
};
