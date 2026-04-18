const repo = require("./FrmBudgetAccountMap.repo");

const getBudgetAccountMapService = async (payload) => {
  return await repo.getBudgetAccountMap(payload);
};

const getSubHeadListService = async (payload) => {
  return await repo.getSubHeadList(payload.headId);
};

const getGroupListService = async (payload) => {
  return await repo.getGroupList(payload.subHeadId);
};

const getSubGroupListService = async (payload) => {
  return await repo.getSubGroupList(payload.groupId);
};

const insertBudgetAccountMapService = async (body) => {
  const data = await repo.insertBudgetAccountMap(
    body.userId,
    body.subGroupId,
    body.paramStr,
    body.ulbId
  );

  console.log("Service Data:", data); // 👈 DEBUG

  return data;   // ✅ MUST RETURN THIS
};

module.exports = { getBudgetAccountMapService, 
    getSubHeadListService, getGroupListService, 
    getSubGroupListService,insertBudgetAccountMapService };
