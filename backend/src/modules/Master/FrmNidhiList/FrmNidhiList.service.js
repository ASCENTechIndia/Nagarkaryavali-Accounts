const repo = require("./FrmNidhiList.repo");
const { AppError } = require("../../../libs/errors");

async function getNidhiListService() {
  const data = await repo.getNidhiList();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getNidhiByIdService(nidhiId) {
  if (!nidhiId) {
    throw new AppError("NidhiId is required", 400);
  }

  const data = await repo.getNidhiById(nidhiId);

  if (!data || data.length === 0) {
    throw new AppError("Nidhi not found", 404);
  }

  return {
    success: true,
    data: data[0],
  };
}

async function nidhiMasterService(data) {
  if (!data.mode) {
    throw new AppError("Mode is required (1=Insert, 2=Update, 3=Delete)", 400);
  }

  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }

  if (!data.nidhiName) {
    throw new AppError("Nidhi Name is required", 400);
  }

  if (data.mode !== 1 && !data.nidhiId) {
    throw new AppError("NidhiId is required for Update/Delete", 400);
  }

  const result = await repo.nidhiMasterProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Procedure failed", 500);
  }

  if (result.errorCode < 0 && result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }

  let message = "";
  if (data.mode === 1) message = "Nidhi created successfully";
  else if (data.mode === 2) message = "Nidhi updated successfully";
  else if (data.mode === 3) message = "Nidhi deleted successfully";

  console.log("Service Result: ", result);

  return {
    success: true,
    message,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
  };
}

module.exports = {
  getNidhiListService,
  getNidhiByIdService,
  nidhiMasterService,
};