const repo = require("./FrmInterestRtMst.repo");
const { AppError } = require("../../../libs/errors");

// ============================================
// GET INTEREST LIST
// ============================================
async function getInterestListService(payload) {
  console.log(" Service: Fetch Interest List", payload);

  const data = await repo.getInterestListRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

// ============================================
// GET INTEREST BY ID
// ============================================
async function getInterestByIdService(payload) {
  console.log("Service: Fetch Interest By ID", payload);

  const data = await repo.getInterestByIdRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

// ============================================
// SAVE INTEREST
// ============================================

async function saveInterestService(interestData) {
  if (!interestData.userId) {
    return { success: false, errorCode: -120, message: "User ID is required" };
  }
  if (!interestData.ulbId) {
    return { success: false, errorCode: -120, message: "ULB ID is required" };
  }

  const result = await repo.insertInterestRepo({
    ulbId:        interestData.ulbId,
    interestId:   interestData.interestId || 0,
    fromDate:     interestData.fromDate,
    toDate:       interestData.toDate,
    interestRate: interestData.interestRate,
    userId:       interestData.userId,
    mode:         interestData.mode || 1,
  });

  console.log("Service insertInterestRepo Result:", result);

  if (!result.success) {
    return {
      success: false,
      errorCode: -110,
      message: "Unable to process the request. Please try again.",
    };
  }

  if (result.errorCode !== -100) {
    const cleanMsg = (result.errorMsg || "Unable to save interest record.")
      .replace(/Message Code\s*:\s*-\d+\s*-\s*/, "")
      .trim();

    return {
      success: false,
      errorCode: result.errorCode,
      message: cleanMsg,
    };
  }

  return {
    success: true,
    errorCode: -100,
    message: (result.errorMsg || "Interest saved successfully")
      .replace(/Message Code\s*:\s*-\d+\s*-\s*/, "")
      .trim(),
  };
}

module.exports = {
  getInterestListService,
  getInterestByIdService,
  saveInterestService,
};