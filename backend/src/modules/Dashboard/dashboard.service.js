const dashboardRepo = require("./dashboard.repo");

const getBindPayModeGridservice = async (corpId) => {
  const data = await dashboardRepo.BindPayModeGrid(corpId);
  return data || [];
};

const getBindReceiptGridService = async (corpId) => {
  const data = await dashboardRepo.BindReceiptGrid(corpId);
  return data || [];
};
const getBindGrantsGridService = async (corpId) => {
  const data = await dashboardRepo.BindGrantsGrid(corpId);
  return data || [];
};

module.exports = {
  getBindPayModeGridservice,
  getBindReceiptGridService,
  getBindGrantsGridService,
};
