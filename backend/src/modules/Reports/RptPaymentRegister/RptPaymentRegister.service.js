const repo = require("./RptPaymentRegister.repo");

const getPaymentRegisterService = async (payload) => {
  return await repo.getPaymentRegister(payload);
};

module.exports = { getPaymentRegisterService };