
const repo = require("./RptReceiptRegister.repo");

const getReceiptRegisterService = async (body) => {
  return await repo.getReceiptRegister(body);
};

module.exports = { getReceiptRegisterService };