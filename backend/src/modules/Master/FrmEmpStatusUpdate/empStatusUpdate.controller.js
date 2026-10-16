
const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./empStatusUpdate.service");

exports.saveEmpStatusUpdate = asyncHandler(async (req, res) => {
  console.log("📥 Request: Employee Status Update:", req.body);

  const {
    id,
    empId,
    employeeId,
    status,
    statusDate,
    reason,
    mode,
  } = req.body;

  const userId =
    req.body.userId ||
    req.user?.userId ||
    req.user?.userName ||
    req.user?.username ||
    "Admin";

  const ulbId = req.body.ulbId || req.user?.ulbId;

  const resolvedEmpId = empId ?? employeeId;

  if (mode === undefined || mode === null || mode === "") {
    throw new AppError("Mode is required", 400);
  }

  const numericMode = Number(mode);

  if (![1, 2, 3].includes(numericMode)) {
    throw new AppError("Mode must be 1, 2, or 3", 400);
  }

  if (
    [2, 3].includes(numericMode) &&
    (id === undefined || id === null || id === "")
  ) {
    throw new AppError("Employee Status ID is required", 400);
  }

  if (
    [1, 2].includes(numericMode) &&
    (resolvedEmpId === undefined ||
      resolvedEmpId === null ||
      resolvedEmpId === "")
  ) {
    throw new AppError("Employee ID is required", 400);
  }

  const payload = {
    userId: String(userId),
    id: id === "" || id == null ? null : Number(id),
    ulbId: ulbId === "" || ulbId == null ? null : Number(ulbId),
    empId:
      resolvedEmpId === "" || resolvedEmpId == null
        ? null
        : Number(resolvedEmpId),
    status,
    statusDate,
    reason,
    mode: numericMode,
  };

  const data = await service.saveEmpStatusUpdateService(payload);

  return ok(
    res,
    data,
    data.message || "Employee status operation completed"
  );
});
