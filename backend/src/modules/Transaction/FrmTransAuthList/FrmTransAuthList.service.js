const repo = require("./FrmTransAuthList.repo");

const getTransactionListService = async (body) => {
  const data = await repo.getTransactionList(body);

  return data; // directly return
};
module.exports = { getTransactionListService };
