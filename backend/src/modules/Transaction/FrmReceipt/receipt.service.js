const repo = require("./receipt.repo");
const { AppError } = require("../../../libs/errors");


// ================= 1. Receipt List =================
async function getReceiptList(data) {
  const result = await repo.getReceiptListRepo(
    data.ddl_ZoneID,
    data.ddl_ULB_ID
  );

  if (!result) {
    throw new AppError("Failed to fetch receipt list", 500);
  }

  return result.rows;
}


// ================= 2. Zones =================
async function getZones(data) {
  const result = await repo.getZonesRepo(data.corp_id);

  if (!result) {
    throw new AppError("Failed to fetch zones", 500);
  }

  return result.rows;
}


// ================= 3. Corporation =================
async function getCorporation(data) {
  const result = await repo.getCorporationRepo(data.corp_id);

  if (!result) {
    throw new AppError("Failed to fetch corporation", 500);
  }

  return result.rows;
}


// ================= 4. Departments =================
async function getDepartments(data) {
  const result = await repo.getDepartmentsRepo(data.ulbid);

  if (!result) {
    throw new AppError("Failed to fetch departments", 500);
  }

  return result.rows;
}


// ================= 5. Narration =================
async function getNarration() {
  const result = await repo.getNarrationRepo();

  if (!result) {
    throw new AppError("Failed to fetch narration", 500);
  }

  return result.rows;
}


// ================= 6. Transaction Type =================
async function getTransType() {
  const result = await repo.getTransTypeRepo();

  if (!result) {
    throw new AppError("Failed to fetch transaction types", 500);
  }

  return result.rows;
}


// ================= 7. Receipt Details =================
async function getReceiptDetails(data) {
  const result = await repo.getReceiptDetailsRepo(data.RefNo);

  if (!result) {
    throw new AppError("Failed to fetch receipt details", 500);
  }

  return result.rows;
}


// ================= 8. Party =================
async function getParty(data) {
  const result = await repo.getPartyRepo(data.ulbid);

  if (!result) {
    throw new AppError("Failed to fetch party list", 500);
  }

  return result.rows;
}


// ================= 9. Search GL =================
async function searchGL() {
  const result = await repo.searchGLRepo();

  if (!result) {
    throw new AppError("Failed to fetch GL list", 500);
  }

  return result.rows;
}

async function searchGLALL() {
  const result = await repo.searchGLALLRepo();

  if (!result) {
    throw new AppError("Failed to fetch GL list", 500);
  }

  return result.rows;
}


// ================= 10. Insert / Update Receipt =================
async function receiptInsertUpdate(data) {
  const result = await repo.receiptInsertUpdateRepo(data);

  if (!result) {
    throw new AppError("Failed to insert/update receipt", 500);
  }

  // Optional: handle DB error codes
  if (result.errorCode && result.errorCode !== 0) {
    throw new AppError(result.message || "Database error", 400);
  }

  return result;
}


async function getBudgetHeads() {
  const result = await repo.getBudgetHeadsRepo();

  if (!result) {
    throw new AppError("Failed to fetch budget heads", 500);
  }

  return result.rows;
}

// ================= EXPORT =================
module.exports = {
  getReceiptList,
  getZones,
  getCorporation,
  getDepartments,
  getNarration,
  getTransType,
  getReceiptDetails,
  getParty,
  searchGL,
  receiptInsertUpdate,
  searchGLALL,
  getBudgetHeads
};