const service = require("./RptPaymentRegister.service");
const asyncHandler = require("../../../libs/asyncHandler");

const getPaymentRegister = asyncHandler(async (req, res) => {
  const result = await service.getPaymentRegisterService(req.body);

  if (!result.rows || result.rows.length === 0) {
    return res.json({
      success: false,
      message: "No Payment Records Found",
      data: result
    });
  }

  res.json({
    success: true,
    message: "Payment Register fetched successfully",
    data: result
  });
});

module.exports = { getPaymentRegister };