const service = require("./RptTransferRegister.service");
const asyncHandler = require("../../../libs/asyncHandler");

const getTransferRegister = asyncHandler(async (req, res) => {
  const result = await service.getTransferRegisterService(req.body);

  if (!result.rows || result.rows.length === 0) {
    return res.json({
      success: false,
      message: "Transaction Record Not Found",
      data: result
    });
  }

  res.json({
    success: true,
    message: "Transfer register fetched successfully",
    data: result
  });
});

module.exports = { getTransferRegister };