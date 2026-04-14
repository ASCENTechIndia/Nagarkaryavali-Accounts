const repo = require("./FrmBalanceSheetGroupList.repo");
const { AppError } = require("../../../libs/errors");

// List
async function getBalGroupListService() {
  const data = await repo.getBalGroupList();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// By ID
async function getBalGroupByIdService(balgrpId) {
  if (!balgrpId) {
    throw new AppError("BalgrpId is required", 400);
  }

  const data = await repo.getBalGroupById(balgrpId);

  if (!data || data.length === 0) {
    throw new AppError("Balance Group not found", 404);
  }

  return {
    success: true,
    data: data[0],
  };
}

// Procedure
async function balGroupService(data) {
  if (!data.mode) {
    throw new AppError("Mode is required (1=Insert,2=Update,3=Delete)", 400);
  }

  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }

  if (!data.balgrpName) {
    throw new AppError("Balance Group Name is required", 400);
  }

  if (data.mode !== 1 && !data.balgrpId) {
    throw new AppError("BalgrpId required for update/delete", 400);
  }

  const result = await repo.balGroupProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure failed", 500);
  }

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }



  return {
    success: true,
   
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
  };
}

module.exports = {
  getBalGroupListService,
  getBalGroupByIdService,
  balGroupService,
};