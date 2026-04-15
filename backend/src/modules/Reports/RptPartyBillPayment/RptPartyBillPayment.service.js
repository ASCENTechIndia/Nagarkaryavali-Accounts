const repo = require("./RptPartyBillPayment.repo");

const getPartyBillPaymentService = async (payload) => {
  const result = await repo.getPartyBillPayment(payload);
  return result;
};

const getForm64ReportService = async (payload) => {
  return await repo.getForm64Report(payload);
};

const getForm63ReportService = async (payload) => {
  return await repo.getForm63Report(payload);
};

module.exports = { getPartyBillPaymentService,getForm63ReportService, getForm64ReportService };