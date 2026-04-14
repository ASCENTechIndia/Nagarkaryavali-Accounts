const repo = require("./frmAccount.repo");

async function getAccountDetailsService(payload) {
  console.log("📥 Service: Fetch Account Details", payload);

  const data = await repo.getAccountDetailsRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function searchAccountService(payload) {
  console.log("📥 Service: Search Account", payload);

  const data = await repo.searchAccountRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function searchGLService(payload) {
  console.log("📥 Service: Search GL", payload);

  const data = await repo.searchGLRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getGLMasterListService() {
  console.log("📥 Service: Fetch GL Master List");

  const data = await repo.getGLMasterListRepo();

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getAccountTypeService() {
  console.log("📥 Service: Fetch Account Types");

  const data = await repo.getAccountTypeRepo();

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getAccountSubTypeService() {
  console.log("📥 Service: Fetch Account Subtypes");

  const data = await repo.getAccountSubTypeRepo();

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getReportHeadsService(payload) {
  console.log("📥 Service: Fetch Report Heads", payload);
  const data = await repo.getReportHeadsRepo(payload);
  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getBankMasterService() {
  console.log("📥 Service: Fetch Bank Master");
  const data = await repo.getBankMasterRepo();
  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getNidhiMasterService() {
  console.log("📥 Service: Fetch Nidhi Master");
  const data = await repo.getNidhiMasterRepo();
  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getAccountFullDetailsService(payload) {
  console.log("📥 Service: Fetch Full Account Details", payload);

  const data = await repo.getAccountFullDetailsRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getAccountZoneDetailsService(payload) {
  console.log("📥 Service: Fetch Account Zone Details", payload);

  const data = await repo.getAccountZoneDetailsRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getAccountMappingDetailsService(payload) {
  console.log("📥 Service: Fetch Account Mapping Details", payload);

  const data = await repo.getAccountMappingDetailsRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getNextAccountNoService(payload) {
  console.log("📥 Service: Fetch Next Account Number", payload);

  const data = await repo.getNextAccountNoRepo(payload);

  return {
    success: true,
    data: data[0] || {},
  };
}

async function getZoneListService(payload) {
  console.log("📥 Service: Fetch Zone List", payload);

  const data = await repo.getZoneListRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function saveAccountMasterService(payload) {
  console.log("📥 Service: Save Account Master", payload);

  const result = await repo.saveAccountMasterRepo(payload);

  return {
    success: result.out_ErrorCode === -100,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
  };
}

async function getFilteredAccSubTypeService(payload) {
  console.log("📥 Service: Fetch Filtered Account SubTypes", payload);

  const data = await repo.getFilteredAccSubTypeRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

module.exports = {
  getAccountDetailsService,
  searchAccountService,
  searchGLService,
  getGLMasterListService,
  getAccountTypeService,
  getAccountSubTypeService,
  getReportHeadsService,
  getBankMasterService,
  getNidhiMasterService,
  getAccountFullDetailsService,
  getAccountZoneDetailsService,
  getAccountMappingDetailsService,
  getNextAccountNoService,
  getZoneListService,
  saveAccountMasterService,
  getFilteredAccSubTypeService
};