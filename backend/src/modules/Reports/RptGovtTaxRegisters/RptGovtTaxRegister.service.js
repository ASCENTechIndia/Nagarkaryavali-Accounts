const repo = require("./RptGovtTaxRegister.repo");
const { AppError } = require("../../../libs/errors");

const getGovtTaxRegisterService1 = async (body) => {
  const { fromDate, toDate } = body;

  if (!fromDate) throw new AppError("From Date required", 400);
  if (!toDate) throw new AppError("To Date required", 400);

  const result = await repo.getGovtTaxRegister1(body);
    console.log("result",result)
  return {
    success: true,
    rows: result.rows,
    rowCount: result.rows.length,
  };
};

const getGovtTaxRegisterSummaryService = async (body) => {
  const { fromDate, toDate } = body;

  if (!fromDate) throw new AppError("From Date required", 400);
  if (!toDate) throw new AppError("To Date required", 400);

  const result = await repo.getGovtTaxRegisterSummary(body);
    console.log("result",result)
  return {
    success: true,
    rows: result.rows,
    rowCount: result.rows.length,
  };
};

const getGovtTaxSummary2Service = async (body) => {
  const result = await repo.getGovtTaxSummary2(body);
    console.log("result",result.length)
  return {
    success: true,
    rows: result.rows
  };
};

module.exports = { 
    getGovtTaxRegisterService1, 
    getGovtTaxRegisterSummaryService,
    getGovtTaxSummary2Service 
};