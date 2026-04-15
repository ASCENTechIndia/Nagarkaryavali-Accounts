const repo = require("./RptTransferRegister.repo");

const getTransferRegisterService = async (payload) => {
  const result = await repo.getTransferRegister(payload);

  return result;
};

module.exports = { getTransferRegisterService };