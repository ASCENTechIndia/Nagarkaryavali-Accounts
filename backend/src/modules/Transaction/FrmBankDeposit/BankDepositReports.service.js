const repo = require("./BankDepositReports.repo");

const getDepartmentsService = async (ulbId) => {
  const data = await repo.getDepartments(ulbId);
  return { success: true, count: data.length, list: data };
};

const getSummaryService = async (filters) => {
  const data = await repo.getBankDepositSummary(filters);
  return { success: true, count: data.length, list: data };
};

const getAccountWiseService = async (filters) => {
  const data = await repo.getAccountWiseReport(filters);
  return { success: true, count: data.length, list: data };
};

const getChallanService = async (filters) => {
  const data = await repo.getChallanReport(filters);
  return { success: true, count: data.length, list: data };
};

const searchGLService = async (prefix) => {
  const data = await repo.searchGL(prefix);
  return { success: true, count: data.length, list: data };
};
const insertCashierReceiptService = async (data) => {
  const result = await repo.insertCashierReceipt(data);

  if (result.out_ErrorCode !== -100) {
    throw new Error(result.out_ErrorMsg);
  }

  return {
    success: true,
    refNo: result.out_ReturnStr,
    message: result.out_ErrorMsg
  };
};
const getZoneDropdownService = async (filters) => {
  const data = await repo.getZoneDropdown(filters);

  return {
    success: true,
    count: data.length,
    list: data
  };
};
module.exports = {
  getDepartmentsService,
  getSummaryService,
  getAccountWiseService,
  getChallanService,
  searchGLService,
  insertCashierReceiptService,
  getZoneDropdownService
};