const repo = require("./FromBankbranch.repo");
const { AppError } = require("../../../libs/errors");

// Bank List
async function getBankListService() {
  const data = await repo.getBankList();
  return { success: true, count: data.length, list: data };
}

// Branch List
async function getBranchListService(bankId) {
  if (!bankId) throw new AppError("BankId is required", 400);

  const data = await repo.getBranchList(bankId);
  return { success: true, count: data.length, list: data };
}

// Branch By ID
async function getBranchByIdService(branchId) {
  if (!branchId) throw new AppError("BranchId is required", 400);

  const data = await repo.getBranchById(branchId);

  if (!data || data.length === 0) {
    throw new AppError("Branch not found", 404);
  }

  return { success: true, data: data[0] };
}

// Procedure
async function bankBranchService(data) {
  if (!data.mode) throw new AppError("Mode required", 400);
  if (!data.userId) throw new AppError("UserId required", 400);
  if (!data.branchName) throw new AppError("Branch Name required", 400);

  if (data.mode !== 1 && !data.branchId) {
    throw new AppError("BranchId required for update/delete", 400);
  }

  const result = await repo.bankBranchProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure failed", 500);
  }

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }

  let message = "";
  if (data.mode === 1) message = "Branch created successfully";
  if (data.mode === 2) message = "Branch updated successfully";
  if (data.mode === 3) message = "Branch deleted successfully";

  return { success: true, message, ...result };
}

module.exports = {
  getBankListService,
  getBranchListService,
  getBranchByIdService,
  bankBranchService,
};