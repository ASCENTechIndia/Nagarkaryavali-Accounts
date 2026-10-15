const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./FrmDCPSnoGenarationMst.service");

/**
 * Controller: Get Employee Details by Employee No / ID / Name
 */
exports.getEmployeeByNo = asyncHandler(async (req, res) => {
  console.log("📥 Request Body (Fetch Employee):", req.body);

  const employeeNo = req.body.employeeNo || req.body.empNo;
  const employeeId = req.body.employeeId || req.body.empid;
  const employeeName = req.body.employeeName;
  const ulbId = req.body.ulbId || req.user?.ulbId;

  if (!employeeNo && !employeeId && !employeeName) {
    throw new AppError("employeeNo किंवा employeeName प्रविष्ट करणे आवश्यक आहे", 400);
  }

  const payload = {
    employeeNo,
    employeeId,
    employeeName,
    ulbId,
  };

  const data = await service.getEmployeeByNoService(payload);

  return ok(res, data, "Employee details fetched successfully");
});

/**
 * Controller: Save / Generate DCPS Number using AOAC_DCPSNOGEN_INS procedure
 */
exports.saveDCPS = asyncHandler(async (req, res) => {
  console.log("📥 Request Body (Save DCPS):", req.body);

  const employeeId = req.body.employeeId || req.body.empid || req.body.employeeNo;
  const openingBalance =
    req.body.openingBalance !== undefined
      ? req.body.openingBalance
      : req.body.openingDcpsBalance;

  const userId = req.body.userId || req.user?.userName || req.user?.userId || "Admin";
  const ulbId = req.body.ulbId || req.user?.ulbId || 930;

  if (!employeeId) {
    throw new AppError("Employee ID is required", 400);
  }

  if (openingBalance === undefined || openingBalance === null || openingBalance === "") {
    throw new AppError("Opening DCPS Balance is required", 400);
  }

  const payload = {
    employeeId,
    openingBalance: parseFloat(openingBalance) || 0,
    userId: String(userId),
    ulbId: parseInt(ulbId, 10),
  };

  const data = await service.saveDCPSService(payload);

  return ok(res, data, data.message || "Operation executed successfully");
});

/**
 * Controller: Fetch Generated DCPS List
 */
exports.getDCPSList = asyncHandler(async (req, res) => {
  console.log("📥 Request Body (DCPS List):", req.body || req.query);

  const ulbId = req.query.ulbId || req.body.ulbId || req.user?.ulbId;

  const data = await service.getDCPSListService({ ulbId });

  return ok(res, data, "DCPS list fetched successfully");
});
