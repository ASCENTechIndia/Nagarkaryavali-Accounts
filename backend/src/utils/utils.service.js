const repo = require("./utils.repo");
const { AppError } = require("../libs/errors");

async function fetchUserTypeList() {
  const result = await repo.getUserTypeList();

  if (!result.success) {
    throw new AppError(result.error || "Failed to fetch user types", 500);
  }

  return result.rows;
}

async function fetchCollCenterList() {
  const result = await repo.getCollCenterList();

  if (!result.success) {
    throw new AppError(result.error || "Failed to fetch collection centers", 500);
  }

  return result.rows;
}
async function fetchPrabhagList() {
  const result = await repo.getPrabhagList();
  if (!result.success) {
    throw new AppError("Failed to fetch prabhag list", 500);
  }
  return result.rows;
}

async function fetchPrabhagById(prabhagId) {
  const result = await repo.getPrabhagById(prabhagId);
  if (!result.success) {
    throw new AppError("Failed to fetch prabhag", 500);
  }
  return result.rows;
}

async function fetchReceiptModeList() {
  const result = await repo.getReceiptModeList();
  if (!result.success) {
    throw new AppError("Failed to fetch receipt modes", 500);
  }
  return result.rows;
}

async function fetchBankReceiptList() {
  const result = await repo.getBankReceiptList();
  if (!result.success) {
    throw new AppError("Failed to fetch bank receipt list", 500);
  }
  return result.rows;
}

async function fetchReceiptTypes() {
  const result = await repo.getReceiptTypes();
  if (!result.success) {
    throw new AppError("Failed to fetch receipt types", 500);
  }
  return result.rows;
}

async function fetchZonesByPrabhag(prabhagId) {
  const result = await repo.getZonesByPrabhag(prabhagId);
  if (!result.success) {
    throw new AppError("Failed to fetch zones", 500);
  }
  return result.rows;
}

async function fetchWardsByZone(zoneId) {
  const result = await repo.getWardsByZone(zoneId);
  if (!result.success) {
    throw new AppError("Failed to fetch wards", 500);
  }
  return result.rows;
}
async function fetchWardsByPrabhag(prabhagId) {
  const result = await repo.getWardsByPrabhag(prabhagId);
  if (!result.success) {
    throw new AppError("Failed to fetch wards", 500);
  }
  return result.rows;
}

async function fetchYears() {
  const result = await repo.fetchYears();

  if (!result || result.rowCount === 0) {
    throw new AppError("No financial years found", 404);
  }

  return result.rows;
}

async function getAllUsers() {
  const result = await repo.getAllUsers();

  if (!result || result.rowCount === 0) {
    throw new AppError("No users found", 404);
  }

  return result.rows;
}

async function fetchPrabhagByUser(userId) {
  const result = await repo.getPrabhagByUser(userId);

  if (!result.success) {
    throw new AppError("Failed to fetch prabhag by user", 500);
  }

  return result.rows;
}


async function fetchZonesByPrabhagAndUser(prabhagId, userId) {
  const result = await repo.getZonesByPrabhagAndUser(prabhagId, userId);

  if (!result.success) {
    throw new AppError("Failed to fetch zones by user", 500);
  }

  return result.rows;
}


async function fetchWardsByZoneAndUser(zoneId, userId) {
  const result = await repo.getWardsByZoneAndUser(zoneId, userId);

  if (!result.success) {
    throw new AppError("Failed to fetch wards by user", 500);
  }

  return result.rows;
}

async function fetchSubwardList() {
  const result = await repo.getSubwardList();

  if (!result.success) {
    throw new AppError("Failed to fetch subward list", 500);
  }

  return result.rows;
}

module.exports = {
  fetchUserTypeList,
  fetchCollCenterList,
  fetchPrabhagList,
  fetchPrabhagById,
  fetchReceiptModeList,
  fetchBankReceiptList,
  fetchReceiptTypes,
  fetchZonesByPrabhag,
  fetchWardsByZone,
  fetchWardsByPrabhag,
  fetchYears,
  getAllUsers,
  fetchPrabhagByUser,
  fetchZonesByPrabhagAndUser,
  fetchWardsByZoneAndUser,
  fetchSubwardList
};

