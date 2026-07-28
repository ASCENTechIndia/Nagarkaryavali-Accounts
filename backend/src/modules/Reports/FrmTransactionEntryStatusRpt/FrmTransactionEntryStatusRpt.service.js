const repo = require("./FrmTransactionEntryStatusRpt.repo");

//---------------- USER LIST ----------------//

const getUserListService = async (body) => {
  const { ulbId } = body;

  if (!ulbId) {
    throw new Error("ulbId is required");
  }

  return await repo.getUserList(ulbId);
};

//---------------- REPORT ----------------//

const getTransactionEntryStatusReportService = async (body) => {
  return await repo.getReceiptRegisterEntryStatus(body);
};

module.exports = {
  getUserListService,
  getTransactionEntryStatusReportService,
};