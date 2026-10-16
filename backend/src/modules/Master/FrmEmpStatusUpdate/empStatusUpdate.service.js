
const { AppError } = require("../../../libs/errors");
const repo = require("./empStatusUpdate.repo");


async function saveEmpStatusUpdateService(payload) {
  console.log("📥 Service: Employee Status Update:", {
    ...payload,
    reason: payload.reason ? "[provided]" : null,
  });

  const {
    userId,
    id,
    ulbId,
    empId,
    status,
    statusDate,
    reason,
    mode,
  } = payload;

  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  if (![1, 2, 3].includes(Number(mode))) {
    throw new AppError("Mode must be 1, 2, or 3", 400);
  }

  const numericMode = Number(mode);

  if ([2, 3].includes(numericMode) && (!Number.isInteger(Number(id)) || Number(id) <= 0)) {
    throw new AppError("Valid Employee Status ID is required", 400);
  }

  if ([1, 2].includes(numericMode)) {
    if (!Number.isInteger(Number(ulbId)) || Number(ulbId) <= 0) {
      throw new AppError("Valid ULB ID is required", 400);
    }

    if (!Number.isInteger(Number(empId)) || Number(empId) <= 0) {
      throw new AppError("Valid Employee ID is required", 400);
    }

    if (!["Y", "N"].includes(String(status || "").toUpperCase())) {
      throw new AppError("Employee status must be Y or N", 400);
    }

    if (!statusDate) {
      throw new AppError("Status date is required", 400);
    }

    const parsedDate = new Date(statusDate);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError("Invalid status date", 400);
    }

    if (
      String(status).toUpperCase() === "N" &&
      !String(reason ?? "").trim()
    ) {
      throw new AppError("Reason is required for inactive status", 400);
    }
  }

  const result = await repo.saveEmpStatusUpdateRepo({
    userId: String(userId),
    id: id === "" || id == null ? null : Number(id),
    ulbId: ulbId === "" || ulbId == null ? null : Number(ulbId),
    empId: empId === "" || empId == null ? null : Number(empId),
    status: status ? String(status).toUpperCase() : null,
    statusDate: statusDate || null,
    reason: reason ? String(reason).trim() : null,
    mode: numericMode,
  });

  const errorCode = result.out_ErrorCode;
  const message = result.out_ErrorMsg;

  return {
    success: Number(errorCode) === -100,
    errorCode,
    message,
  };
}


async function getEmpStatusUpdateService(payload) {
    console.log("📥 Service: Fetch Employee Status Update", payload);

    const data = await repo.getEmpStatusUpdateRepo(payload);

    return {
        success: true,
        count: data.length,
        data,
    };
}

module.exports = {
  saveEmpStatusUpdateService,
  getEmpStatusUpdateService
};
