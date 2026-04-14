const repo = require("./receipt.repo");
const { AppError } = require("../../libs/errors");

// ================= APIs =================

async function getReceiptList(data) {
  const result = await repo.getReceiptListRepo(data.ddl_ZoneID, data.ddl_ULB_ID);

  if (!result) {
    throw new AppError("Failed to fetch receipt list", 500);
  }

  return result.rows;
}

async function getZones(data) {
  const result = await repo.getZonesRepo(data.corp_id);

  if (!result) {
    throw new AppError("Failed to fetch zones", 500);
  }

  return result.rows;
}

async function getCorporation(data) {
  const result = await repo.getCorporationRepo(data.corp_id);

  if (!result) {
    throw new AppError("Failed to fetch corporation", 500);
  }

  return result.rows;
}

async function getDepartments(data) {
  const result = await repo.getDepartmentsRepo(data.ulbid);

  if (!result) {
    throw new AppError("Failed to fetch departments", 500);
  }

  return result.rows;
}

async function getBudgetHeads() {
  const result = await repo.getBudgetHeadsRepo();

  if (!result) {
    throw new AppError("Failed to fetch budget heads", 500);
  }

  return result.rows;
}

async function getNarration() {
  const result = await repo.getNarrationRepo();

  if (!result) {
    throw new AppError("Failed to fetch narration", 500);
  }

  return result.rows;
}

async function getTransType() {
  const result = await repo.getTransTypeRepo();

  if (!result) {
    throw new AppError("Failed to fetch transaction types", 500);
  }

  return result.rows;
}

async function getDeptMaster() {
  const result = await repo.getDeptMasterRepo();

  if (!result) {
    throw new AppError("Failed to fetch department master", 500);
  }

  return result.rows;
}

async function getReceiptDetails(data) {
  const result = await repo.getReceiptDetailsRepo(data.RefNo);

  if (!result) {
    throw new AppError("Failed to fetch receipt details", 500);
  }

  return result.rows;
}

async function getGrampanch(data) {
  const result = await repo.getGrampanchRepo(data.ZoneId);

  if (!result) {
    throw new AppError("Failed to fetch grampanch", 500);
  }

  return result.rows;
}

async function getParty(data) {
  const result = await repo.getPartyRepo(data.ulbid);

  if (!result) {
    throw new AppError("Failed to fetch party", 500);
  }

  return result.rows;
}

async function getAccountName(data) {
  const result = await repo.getAccountNameRepo(data.glcode, data.accno);

  if (!result) {
    throw new AppError("Failed to fetch account name", 500);
  }

  return result.rows;
}

// ================= PROCEDURE =================

async function receiptInsertUpdate(data) {
  const result = await repo.receiptInsertUpdateRepo(data);

  if (!result || result.out_ErrorCode !== 0) {
    throw new AppError(result?.out_ErrorMsg || "Failed to save receipt", 500);
  }

  return {
    refNo: result.out_ReturnStr,
    message: result.out_ErrorMsg,
    errorCode: result.out_ErrorCode
  };
}

module.exports = {
  getReceiptList,
  getZones,
  getCorporation,
  getDepartments,
  getBudgetHeads,
  getNarration,
  getTransType,
  getDeptMaster,
  getReceiptDetails,
  getGrampanch,
  getParty,
  getAccountName,
  receiptInsertUpdate
};