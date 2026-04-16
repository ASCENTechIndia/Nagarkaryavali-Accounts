const service = require("./FrmBudgetAccountMap.service");
const asyncHandler = require("../../../libs/asyncHandler");

const getBudgetAccountMap = asyncHandler(async (req, res) => {
  try {
    const result = await service.getBudgetAccountMapService(req.body);

    if (!result.rows || result.rows.length === 0) {
      return res.json({
        success: false,
        message: "No Data Found",
        data: result,
      });
    }

    res.json({
      success: true,
      message: "Budget Account Map fetched successfully",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// ================= SUB HEAD =================
const getSubHeadList = asyncHandler(async (req, res) => {
  const result = await service.getSubHeadListService(req.body);

  res.json({
    success: true,
    data: result,
  });
});

// ================= GROUP =================
const getGroupList = asyncHandler(async (req, res) => {
  const result = await service.getGroupListService(req.body);

  res.json({
    success: true,
    data: result,
  });
});

// ================= SUB GROUP =================
const getSubGroupList = asyncHandler(async (req, res) => {
  const result = await service.getSubGroupListService(req.body);

  res.json({
    success: true,
    data: result,
  });
});


const insertBudgetAccountMap = asyncHandler(async (req, res) => {
  const result = await service.insertBudgetAccountMapService(req.body);

  console.log("Controller Result:", result); // 👈 ADD THIS

  res.json({
    success: result.errorCode === -100,   // ✅ IMPORTANT
    message: result.message,
    errorCode: result.errorCode
  });
});


module.exports = { getBudgetAccountMap, getSubHeadList, getGroupList, getSubGroupList, insertBudgetAccountMap };
