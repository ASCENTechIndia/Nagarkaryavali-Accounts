const repo = require("./FrmTransactionEntryStatusRpt.repo");


const getUserListService = async (body) => {
  const { ulbId } = body;

  if (!ulbId) {
    throw new Error("ulbId is required");
  }

  return await repo.getUserList(ulbId);
};


const getTransactionEntryStatusReportService = async (body) => {
  return await repo.getReceiptRegisterEntryStatus(body);
};

module.exports = {
  getUserListService,
  getTransactionEntryStatusReportService,
};