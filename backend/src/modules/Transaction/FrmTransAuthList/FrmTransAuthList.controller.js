const service = require("./FrmTransAuthList.service");
const asyncHandler = require("../../../libs/asyncHandler");

const getTransactionList = asyncHandler(async (req, res) => {
  const response = await service.getTransactionListService(req.body);
  res.json(response);
});

const getUserList = asyncHandler(async (req, res) => {
  const response = await service.getUserListService(req.body);
  res.json(response);
});

const getTransactionDetails = asyncHandler(async (req, res) => {
  const { refNo, trnsTypeId } = req.body;

  if (!refNo || !trnsTypeId) {
    return res.status(400).json({
      success: false,
      message: "refNo and trnsTypeId are required"
    });
  }

  const response = await service.getTransactionDetailsService(req.body);

  res.json({
    success: true,
    message: "Transaction details fetched successfully",
    data: response
  });
});


const insertTransAuth = asyncHandler(async (req, res) => {
  const response = await service.insertTransAuthService(req.body);

  res.json({
    success: true,
    message: "Transaction authorized successfully",
    data: response
  });
});

module.exports = { getTransactionList, getUserList , getTransactionDetails, insertTransAuth};