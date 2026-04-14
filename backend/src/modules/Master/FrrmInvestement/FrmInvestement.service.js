const repo = require("./FrmInvestement.repo");
const { AppError } = require("../../../libs/errors");

// 1. List
async function getInvestmentListService() {
  const data = await repo.getInvestmentList();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

// 2. By ID
async function getInvestmentByIdService(investId) {
  if (!investId) {
    throw new AppError("InvestId is required", 400);
  }

  const data = await repo.getInvestmentById(investId);

  if (!data || data.length === 0) {
    throw new AppError("Investment not found", 404);
  }

  return {
    success: true,
    data: data[0],
  };
}

// 3. Procedure
async function investmentService(data) {
  if (!data.mode) {
    throw new AppError("Mode is required (1=Insert,2=Update,3=Delete)", 400);
  }

  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }

  if (!data.investName) {
    throw new AppError("Investment Name is required", 400);
  }

  if (data.mode !== 1 && !data.investId) {
    throw new AppError("InvestId required for update/delete", 400);
  }

  const result = await repo.investmentProc(data);

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
  getInvestmentListService,
  getInvestmentByIdService,
  investmentService,
};