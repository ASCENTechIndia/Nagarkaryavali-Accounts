const service = require("./FrmTransAuthList.service");
const asyncHandler = require("../../../libs/asyncHandler");

const getTransactionList = asyncHandler(async (req, res) => {
  const response = await service.getTransactionListService(req.body);
  res.json(response);
});

module.exports = { getTransactionList };