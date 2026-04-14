const repo = require("./glmaster.repo");
const { AppError } = require("../../../libs/errors");

async function glMasterService(payload) {
  console.log("📥 Service Payload:", payload);
  const {
    in_Mode,
    in_UserId,
    in_glname,
    in_glcodeid
  } = payload;

  if (!in_Mode) {
    throw new AppError("Mode is required", 400);
  }
  if (![1, 2, 3].includes(Number(in_Mode))) {
    throw new AppError(
      "Mode must be 1 (Insert), 2 (Update), 3 (Delete)",
      400
    );
  }
  if (!in_UserId) {
    throw new AppError("UserId is required", 400);
  }
  if (Number(in_Mode) !== 1 && !in_glcodeid) {
    throw new AppError(
      "GL Code is required for update/delete",
      400
    );
  }
  if (Number(in_Mode) !== 3 && !in_glname) {
    throw new AppError("GL Name is required", 400);
  }

  const result = await repo.glMasterOperation(payload);
  console.log("📥 Procedure Result:", result);

  if (result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 422);
  }

  return {
    success: true,
    message: result.errorMsg,
    errorCode: result.errorCode,
  };
}

async function getGLMasterListService() {
  console.log("📥 Service: Get GL List");
  const data = await repo.getGLMasterList();
  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getGLMasterByIdService(glcodeid) {
  console.log("📥 Service: Get GL by ID:", glcodeid);
  if (!glcodeid) {
    throw new AppError("GL Code is required", 400);
  }

  const data = await repo.getGLMasterById(glcodeid);
  if (!data || data.length === 0) {
    throw new AppError("GL Record not found", 404);
  }
  return {
    success: true,
    data: data[0], // single record
  };
}


module.exports = {
  glMasterService,
  getGLMasterListService,
  getGLMasterByIdService
};