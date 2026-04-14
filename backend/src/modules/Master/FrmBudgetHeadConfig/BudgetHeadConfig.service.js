const repo = require("./BudgetHeadConfig.repo");

async function getBudgetHeadConfigService(payload) {
  console.log("📥 Service Payload:", payload);

  const data = await repo.getBudgetHeadConfig(payload);
  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getSubHead() {
  console.log("📥 Service: Fetch Budget Level 2");

  const data = await repo.SubHead();
  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getGroup(payload) {
  console.log("📥 Service: Fetch Group", payload);

  const data = await repo.getGroup(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getHead() {
  console.log("📥 Service: Fetch Head");

  const data = await repo.getHead();

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getBudgetByLevel(payload) {
  console.log("📥 Service: Fetch Budget By Level", payload);

  const data = await repo.getBudgetByLevel(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function saveBudgetHeadService(payload) {
  console.log("📥 Service: Save Budget Head", payload);

  const result = await repo.saveBudgetHeadRepo(payload);

  return {
    success: result.out_ErrorCode === -100,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
  };
}


module.exports = {
  getBudgetHeadConfigService,
  getSubHead,
  getGroup,
  getHead,
  getBudgetByLevel,
  saveBudgetHeadService
};