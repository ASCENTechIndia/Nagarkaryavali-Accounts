const repo = require("./FrmUserTax.repo");
const { AppError } = require("../../../libs/errors");

async function getAccUserMapListService(payload) {
  if (!payload.userId) {
    throw new AppError("User Id is required", 400);
  }
  const data = await repo.getAccUserMapListRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getAccUserMapByIdService(payload) {
  if (!payload.mainId) {
    throw new AppError("Main Id is required", 400);
  }

  const data = await repo.getAccUserMapByIdRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function saveAccUserMapService(data) {
  if (!data.userId) {
    throw new AppError("User ID is required", 400);
  }

  if (!data.paramStr) {
    throw new AppError("ParamStr is required", 400);
  }

  const result = await repo.saveAccUserMapRepo(data);

  if (!result.success) {
    throw new AppError(result.error, 500);
  }

  return {
    success: true,
    returnStr: result.returnStr,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
  };
}

module.exports = {
  getAccUserMapListService,
  getAccUserMapByIdService,
  saveAccUserMapService,
};
