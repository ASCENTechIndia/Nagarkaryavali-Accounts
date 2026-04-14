const repo = require("./FrmContract.repo");
const { AppError } = require("../../../libs/errors");

async function getZonesService(ulbId) {
  if (!ulbId) {
    throw new AppError("ULB ID is required", 400);
  }

  const data = await repo.getZones(ulbId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getContractListService(zoneId, ulbId) {
  if (!zoneId) {
    throw new AppError("Zone ID is required", 400);
  }
  
  if (!ulbId) {
    throw new AppError("ULB ID is required", 400);
  }

  const data = await repo.getContractList(zoneId, ulbId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getContractByIdService(contractId) {
  if (!contractId) {
    throw new AppError("Contract ID is required", 400);
  }

  const contract = await repo.getContractById(contractId);

  if (!contract || contract.length === 0) {
    throw new AppError("Contract not found", 404);
  }

  const details = await repo.getContractDetails(contractId);

  return {
    success: true,
    data: {
      contract: contract[0],
      details: details
    },
  };
}

async function getContractDetailsService(contractId) {
  if (!contractId) {
    throw new AppError("Contract ID is required", 400);
  }

  const data = await repo.getContractDetails(contractId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function searchGLService(functioncode, ulbId, searchText) {
  if (!ulbId) {
    throw new AppError("ULB ID is required", 400);
  }

  const data = await repo.searchGL(functioncode, ulbId, searchText);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function searchContractorService(searchText, ulbId) {
  if (!ulbId) {
    throw new AppError("ULB ID is required", 400);
  }
  
  if (!searchText) {
    throw new AppError("Search text is required", 400);
  }

  const data = await repo.searchContractor(searchText, ulbId);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function contractMasterService(data) {
  console.log("Service received data:", JSON.stringify(data, null, 2));
  
  if (!data.mode) {
    throw new AppError("Mode is required (1=Insert, 2=Update)", 400);
  }

  if (!data.userId) {
    throw new AppError("UserId is required", 400);
  }

  if (!data.zoneId) {
    throw new AppError("Zone ID is required", 400);
  }

  if (!data.ulbId) {
    throw new AppError("ULB ID is required", 400);
  }

  if (data.mode === 1) {
    if (!data.contractorId) {
      throw new AppError("Contractor ID is required", 400);
    }
    if (!data.contractDate) {
      throw new AppError("Contract Date is required", 400);
    }
    if (!data.amount) {
      throw new AppError("Amount is required", 400);
    }
  }

  if (data.mode === 2 && !data.contractId) {
    throw new AppError("Contract ID is required for update operation", 400);
  }

  // Call the procedure
  const result = await repo.contractMasterProc(data);
  
  console.log("Procedure result:", result);

  // Check if procedure execution failed (based on errorCode)
  if (!result.success || (result.errorCode && result.errorCode !== -100)) {
    throw new AppError(result.errorMsg || result.error || "Failed to process contract", 500);
  }

  let message = "";
  if (data.mode === 1) {
    message = result.errorMsg || "Contract created successfully";
  } else if (data.mode === 2) {
    message = result.errorMsg || "Contract updated successfully";
  }

  return {
    success: true,
    message: message,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
    returnStr: result.returnStr
  };
}

module.exports = {
  getContractListService,
  getContractByIdService,
  getContractDetailsService,
  searchGLService,
  searchContractorService,
  getZonesService,
  contractMasterService,
};