const repo = require("./RptReceiptRegister.repo");

const getReceiptRegisterService = async (body) => {
  return await repo.getReceiptRegister(body);
};

const getReceiptRegisterUserWiseService = async (body) => {
  return await repo.getReceiptRegisterUserWise(body);
};

module.exports = {
  getReceiptRegisterService,
  getReceiptRegisterUserWiseService
};