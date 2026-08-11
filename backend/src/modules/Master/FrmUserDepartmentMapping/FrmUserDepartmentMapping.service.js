const repo = require("./FrmUserDepartmentMapping.repo");
const { AppError } = require("../../../libs/errors");

async function userZoneDeptMasterService(data) {

  if (data.mode === undefined || data.mode === null) {
    throw new AppError(
      "Mode is required (1=Insert, 2=Update)",
      400
    );
  }

  if (![1, 2].includes(Number(data.mode))) {
    throw new AppError(
      "Mode must be 1=Insert or 2=Update",
      400
    );
  }

  if (
    data.userId === undefined ||
    data.userId === null ||
    data.userId === ""
  ) {
    throw new AppError("UserId is required", 400);
  }

  if (
    data.ulbId === undefined ||
    data.ulbId === null ||
    data.ulbId === ""
  ) {
    throw new AppError("UlbId is required", 400);
  }

  if (
    data.zoneId === undefined ||
    data.zoneId === null ||
    data.zoneId === ""
  ) {
    throw new AppError("ZoneId is required", 400);
  }

  if (
    data.userZoneDeptStr === undefined ||
    data.userZoneDeptStr === null ||
    data.userZoneDeptStr === ""
  ) {
    throw new AppError(
      "UserZoneDeptStr is required",
      400
    );
  }
  if (
    data.loginUserId === undefined ||
    data.loginUserId === null ||
    data.loginUserId === ""
  ) {
    throw new AppError("LoginUserId is required", 400);
  }

  const result = await repo.userZoneDeptMasterProc(data);

  if (!result.success) {
    throw new AppError(
      result.error || "Procedure execution failed",
      500
    );
  }


  if (Number(result.errorCode) < 0) {
    throw new AppError(
      result.errorMsg || "Procedure failed",
      400
    );
  }

  let message = "";

  if (Number(data.mode) === 1) {
    message =
      result.errorMsg;
  } else if (Number(data.mode) === 2) {
    message =
      result.errorMsg;
  }

  console.log("Service Result: ", result);

  return {
    success: true,
    message,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
  };
}

async function getUserZoneDeptListService(data) {
    if (
        data.userId === undefined ||
        data.userId === null ||
        data.userId === ""
    ) {
        throw new AppError("UserId is required", 400);
    }

    if (
        data.zoneId === undefined ||
        data.zoneId === null ||
        data.zoneId === ""
    ) {
        throw new AppError("ZoneId is required", 400);
    }

    if (
        data.ulbId === undefined ||
        data.ulbId === null ||
        data.ulbId === ""
    ) {
        throw new AppError("UlbId is required", 400);
    }

    const result = await repo.getUserZoneDeptList({
        userId: data.userId,
        zoneId: Number(data.zoneId),
        ulbId: Number(data.ulbId),
    });

    return {
        success: true,
        rows: result,
    };
}

module.exports = {
  userZoneDeptMasterService,
  getUserZoneDeptListService
};