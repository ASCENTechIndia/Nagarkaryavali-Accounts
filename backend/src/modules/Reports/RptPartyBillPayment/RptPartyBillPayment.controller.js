const service = require("./RptPartyBillPayment.service");
const asyncHandler = require("../../../libs/asyncHandler");

const getPartyBillPayment = asyncHandler(async (req, res) => {
  const result = await service.getPartyBillPaymentService(req.body);

  if (!result.rows || result.rows.length === 0) {
    return res.json({
      success: false,
      message: "No records found",
      data: result,
    });
  }

  res.json({
    success: true,
    message: "Party bill payment fetched successfully",
    data: result,
  });
});

// ===== FORM 64 =====
const getForm64Report = asyncHandler(async (req, res) => {
  const result = await service.getForm64ReportService(req.body);

  if (!result.rows || result.rows.length === 0) {
    return res.json({
      success: false,
      message: "No Data Found for Form64",
      data: result,
    });
  }

  res.json({
    success: true,
    message: "Form64 data fetched successfully",
    data: result,
  });
});

// ===== FORM 63 =====
const getForm63Report = asyncHandler(async (req, res) => {
  const result = await service.getForm63ReportService(req.body);

  if (!result.rows || result.rows.length === 0) {
    return res.json({
      success: false,
      message: "No Data Found for Form63",
      data: result,
    });
  }

  res.json({
    success: true,
    message: "Form63 data fetched successfully",
    data: result,
  });
});

module.exports = { getPartyBillPayment, getForm63Report, getForm64Report };
