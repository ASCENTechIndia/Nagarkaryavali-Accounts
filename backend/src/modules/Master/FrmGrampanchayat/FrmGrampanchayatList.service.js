const repo = require("./FrmGrampanchayatList.repo");
const { AppError } = require("../../../libs/errors");

// Dept List
async function getDeptListService() {
  const data = await repo.getDeptList();
  return { success: true, count: data.length, list: data };
}

// Grampanch List
async function getGrampanchListService(deptId) {
  if (!deptId) throw new AppError("DeptId required", 400);

  const data = await repo.getGrampanchList(deptId);
  return { success: true, count: data.length, list: data };
}

// By ID
async function getGrampanchByIdService(id) {
  if (!id) throw new AppError("GrampanchId required", 400);

  const data = await repo.getGrampanchById(id);

  if (!data.length) throw new AppError("Not found", 404);

  return { success: true, data: data[0] };
}

// Procedure
async function grampanchService(data) {
  if (!data.mode) throw new AppError("Mode required", 400);
  if (!data.userId) throw new AppError("UserId required", 400);
  if (!data.grampanchName) throw new AppError("Name required", 400);

  if (data.mode !== 1 && !data.grampanchId) {
    throw new AppError("GrampanchId required", 400);
  }

  const result = await repo.grampanchProc(data);

  if (!result.success) throw new AppError(result.error, 500);

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }



  return { success: true,  ...result };
}

module.exports = {
  getDeptListService,
  getGrampanchListService,
  getGrampanchByIdService,
  grampanchService,
};