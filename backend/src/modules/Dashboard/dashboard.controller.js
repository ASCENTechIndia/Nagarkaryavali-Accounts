const asyncHandler = require("../../libs/asyncHandler");
const dashboardService = require("./dashboard.service");

// ✅ PayMode
const BindPayModeGridCtrl = asyncHandler(async (req, res) => {
  const { corpId } = req.body;

  if (!corpId) {
    return res.status(400).json({
      success: false,
      message: "corpId is required",
    });
  }

  const data = await dashboardService.getBindPayModeGridservice(corpId);

  res.status(200).json({
    success: true,
    data,
  });
});

// ✅ Receipt
const BindReceiptGridCtrl = asyncHandler(async (req, res) => {
  const { corpId } = req.body;

  if (!corpId) {
    return res.status(400).json({
      success: false,
      message: "corpId is required",
    });
  }

  const data = await dashboardService.getBindReceiptGridService(corpId);

  res.status(200).json({
    success: true,
    data,
  });
});

// ✅ Grants
const BindGrantsGridCtrl = asyncHandler(async (req, res) => {
  const { corpId } = req.body;

  if (!corpId) {
    return res.status(400).json({
      success: false,
      message: "corpId is required",
    });
  }

  const data = await dashboardService.getBindGrantsGridService(corpId);

  res.status(200).json({
    success: true,
    data,
  });
});

module.exports = {
  BindPayModeGridCtrl,
  BindReceiptGridCtrl,
  BindGrantsGridCtrl,
};