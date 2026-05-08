const repo = require("./FrmParty.repo");
const { AppError } = require("../../../libs/errors");

async function getCorporationListService() {
  const data = await repo.getCorporationList();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function searchPartyService(partyId, corpId) {
  if (!corpId) {
    throw new AppError("Corporation is required", 400);
  }

  const data = await repo.searchParty(partyId, corpId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getPartyByIdService(partyId) {

  if (!partyId) {
    throw new AppError("PartyId is required", 400);
  }

  const party = await repo.getPartyById(partyId);

  if (!party || party.length === 0) {
    throw new AppError("Party not found", 404);
  }

  return {
    success: true,
    data: {
      party: party,
    },
  };
}

async function getPartyBankDetails(partyId) {

  if (!partyId) {
    throw new AppError("PartyId is required", 400);
  }

  const bank = await repo.getPartyBankDetails(partyId);

  if (!bank || bank.length === 0) {
    throw new AppError("Bank not found", 404);
  }

  return {
    success: true,
    data: {
      bankDetails: bank,
    },
  };
}

async function getPincodeListService(corpId) {
  if (!corpId) {
    throw new AppError("Corporation is required", 400);
  }

  const data = await repo.getPincodeList(corpId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getIFSCListService(corpId) {
  if (!corpId) {
    throw new AppError("Corporation is required", 400);
  }

  const data = await repo.getIFSCList(corpId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getStateListService() {
  const data = await repo.getStateList();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getBankListService() {
  const data = await repo.getBankList();

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getDistrictByStateService(stateId) {
  if (!stateId) {
    throw new AppError("StateId is required", 400);
  }

  const data = await repo.getDistrictByState(stateId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getCityByDistrictService(districtId) {
  if (!districtId) {
    throw new AppError("DistrictId is required", 400);
  }

  const data = await repo.getCityByDistrict(districtId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getBranchByBankService(bankId) {
  if (!bankId) {
    throw new AppError("BankId is required", 400);
  }

  const data = await repo.getBranchByBank(bankId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getIFSCByBranchService(branchId) {
  if (!branchId) {
    throw new AppError("BranchId is required", 400);
  }

  const data = await repo.getIFSCByBranch(branchId);

  return {
    success: true,
    data: data[0] || {},
  };
}

async function partyMasterService(data) {
  if (!data.mode) {
    throw new AppError("Mode is required (1=Insert, 2=Update, 3=Delete)", 400);
  }

  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }

  if (!data.corpId) {
    throw new AppError("Corporation ID is required", 400);
  }

  if (!data.partyName) {
    throw new AppError("Party Name is required", 400);
  }

  if (data.mode !== 1 && !data.partyId) {
    throw new AppError("PartyId is required for Update/Delete operation", 400);
  }

  const result = await repo.partyMasterProc(data);

  if (!result.success) {
    throw new AppError(result.error || "Failed to process party", 500);
  }

  if (result.errorCode && result.errorCode < 0) {
    throw new AppError(result.errorMsg || "Procedure execution failed", 400);
  }

  let message = "";
  if (data.mode === 1) message = "Party created successfully";
  else if (data.mode === 2) message = "Party updated successfully";
  else if (data.mode === 3) message = "Party deleted successfully";

  return {
    success: true,
    message: message,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg
  };
}

module.exports = {
  getCorporationListService,
  searchPartyService,
  getPartyByIdService,
  getPartyBankDetails,
  getPincodeListService,
  getIFSCListService,
  getStateListService,
  getBankListService,
  getDistrictByStateService,
  getCityByDistrictService,
  getBranchByBankService,
  getIFSCByBranchService,
  partyMasterService,
};