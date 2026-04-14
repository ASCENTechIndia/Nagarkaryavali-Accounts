const repo = require("./frmzoneList.repo");

async function getCorporationService(payload) {
  console.log("📥 Service: Fetch Corporation", payload);

  const data = await repo.getCorporationRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function saveZoneService(payload) {
  console.log("📥 Service: Save Zone", payload);

  const result = await repo.saveZoneRepo(payload);

  return {
    success: result.out_ErrorCode === -100,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
  };
}

module.exports = {
  getCorporationService,
  saveZoneService, 
};
