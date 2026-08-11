const repo = require("./FrmUserDepartmentMapping.repo");
const { AppError } = require("../../../libs/errors");

async function userDeptMasterService(data) {
  if (data.mode === undefined || data.mode === null) {
    throw new AppError("Mode is required (1=Insert, 2=Update)", 400);
  }

  if (![1, 2].includes(Number(data.mode))) {
    throw new AppError("Mode must be 1=Insert or 2=Update", 400);
  }

  if (data.userId === undefined || data.userId === null || data.userId === "") {
    throw new AppError("UserId is required", 400);
  }

  if (data.ulbId === undefined || data.ulbId === null || data.ulbId === "") {
    throw new AppError("UlbId is required", 400);
  }

  if (
    data.userDeptStr === undefined ||
    data.userDeptStr === null ||
    data.userDeptStr === ""
  ) {
    throw new AppError("UserDeptStr is required", 400);
  }

  if (
    data.loginUserId === undefined ||
    data.loginUserId === null ||
    data.loginUserId === ""
  ) {
    throw new AppError("LoginUserId is required", 400);
  }

  const result = await repo.userDeptMasterProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure execution failed", 500);
  }

  if (Number(result.errorCode) < 0) {
    throw new AppError(result.errorMsg || "Procedure failed", 400);
  }

  return {
    success: true,
    message: result.errorMsg,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
  };
}

async function getUserDeptListService(data) {
  if (data.userId === undefined || data.userId === null || data.userId === "") {
    throw new AppError("UserId is required", 400);
  }

  if (data.ulbId === undefined || data.ulbId === null || data.ulbId === "") {
    throw new AppError("UlbId is required", 400);
  }

  const result = await repo.getUserDeptList({
    userId: data.userId,
    ulbId: Number(data.ulbId),
  });

  return {
    success: true,
    rows: result,
  };
}

async function userZoneMasterService(data) {
  if (data.mode === undefined || data.mode === null) {
    throw new AppError("Mode is required (1=Insert, 2=Update)", 400);
  }

  if (![1, 2].includes(Number(data.mode))) {
    throw new AppError("Mode must be 1=Insert or 2=Update", 400);
  }

  if (data.userId === undefined || data.userId === null || data.userId === "") {
    throw new AppError("UserId is required", 400);
  }

  if (data.ulbId === undefined || data.ulbId === null || data.ulbId === "") {
    throw new AppError("UlbId is required", 400);
  }

  if (
    data.userZoneStr === undefined ||
    data.userZoneStr === null ||
    data.userZoneStr === ""
  ) {
    throw new AppError("UserZoneStr is required", 400);
  }

  if (
    data.loginUserId === undefined ||
    data.loginUserId === null ||
    data.loginUserId === ""
  ) {
    throw new AppError("LoginUserId is required", 400);
  }

  const result = await repo.userZoneMasterProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure execution failed", 500);
  }

  if (Number(result.errorCode) < 0) {
    throw new AppError(result.errorMsg || "Procedure failed", 400);
  }

  return {
    success: true,
    message: result.errorMsg,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
  };
}

async function getUserZoneListService(data) {
  if (data.userId === undefined || data.userId === null || data.userId === "") {
    throw new AppError("UserId is required", 400);
  }

  if (data.ulbId === undefined || data.ulbId === null || data.ulbId === "") {
    throw new AppError("UlbId is required", 400);
  }

  const result = await repo.getUserZoneList({
    userId: data.userId,
    ulbId: Number(data.ulbId),
  });

  return {
    success: true,
    rows: result,
  };
}

module.exports = {
  userDeptMasterService,
  getUserDeptListService,
  userZoneMasterService,
  getUserZoneListService
};