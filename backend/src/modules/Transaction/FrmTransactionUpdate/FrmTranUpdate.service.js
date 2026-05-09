const { AppError } = require("../../../libs/errors");
const repo = require("./FrmTranUpdate.repo");


const getVchGenTransView = async (filters) => {
  if (!filters.transno) {
    throw new AppError("Transaction No is required", 400);
  }

  if (!filters.ulbid) {
    throw new AppError("ULB ID is required", 400);
  }

  return await repo.getVchGenTransView(filters);
};


const getTransView = async (filters) => {
  if (!filters.transno) {
    throw new AppError("Transaction No is required", 400);
  }

  if (!filters.ulbid) {
    throw new AppError("ULB ID is required", 400);
  }

  return await repo.getTransView(filters);
};


const deleteTransaction = async (payload) => {
  if (!payload.userid) {
    throw new AppError("User ID is required", 400);
  }

  if (!payload.transno) {
    throw new AppError("Transaction No is required", 400);
  }

  const response = await repo.deleteTransaction(payload);

  return {
    errorCode: response.outBinds.out_ErrorCode,
    errorMsg: response.outBinds.out_ErrorMsg,
  };
};

async function getRevokeList(payload) {
  if (!payload.fromDate) {
    throw new AppError("From Date is required", 400);
  }

  if (!payload.toDate) {
    throw new AppError("To Date is required", 400);
  }

  if (!payload.ulbid) {
    throw new AppError("ULB ID is required", 400);
  }

  if (!payload.type) {
    throw new AppError("Type is required", 400);
  }

  if (!payload.flag) {
    throw new AppError("Flag is required", 400);
  }

  return await repo.getRevokeListRepo(payload);
}

module.exports = {
  getVchGenTransView,
  getTransView,
  deleteTransaction,
  getRevokeList
};