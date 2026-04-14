const repo = require("./BalanceSheetSubGroupList.repo");
const { AppError } = require("../../../libs/errors");


async function getBalGroupListService() {
  const data = await repo.getBalGroupList();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getBalSubGroupListService(groupId) {
  if (!groupId) {
    throw new AppError("GroupId is required", 400);
  }

  const data = await repo.getBalSubGroupList(groupId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function balSubGroupService(data) {
  if (!data.mode) {
    throw new AppError("Mode is required (1=Insert, 2=Update, 3=Delete)", 400);
  }

  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }

  if (!data.subGroupName) {
    throw new AppError("SubGroup Name is required", 400);
  }

  if (data.mode !== 1 && !data.subGroupId) {
    throw new AppError("SubGroupId required for update/delete", 400);
  }

  const result = await repo.balSubGroupProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure failed", 500);
  }

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }

  let message = "";
  if (data.mode === 1) message = "SubGroup created successfully";
  if (data.mode === 2) message = "SubGroup updated successfully";
  if (data.mode === 3) message = "SubGroup deleted successfully";

  return {
    success: true,
    message,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
  };
}
async function getBalSubGroupByIdService(subGroupId) {
  if (!subGroupId) {
    throw new AppError("SubGroupId is required", 400);
  }

  const data = await repo.getBalSubGroupById(subGroupId);

  if (!data || data.length === 0) {
    throw new AppError("SubGroup not found", 404);
  }

  return {
    success: true,
    data: data[0],
  };
}

module.exports = {
  getBalGroupListService,
  getBalSubGroupListService,
  balSubGroupService,
  getBalSubGroupByIdService,
};