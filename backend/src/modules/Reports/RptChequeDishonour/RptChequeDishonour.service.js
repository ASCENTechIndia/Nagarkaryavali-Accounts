const repo = require("./RptChequeDishonour.repo");
const { AppError } = require("../../../libs/errors");

function isValidDate(dateStr) {
  const dateRegex = /^\d{2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/i;
  if (!dateRegex.test(dateStr)) {
    return false;
  }
  
  const parsedDate = new Date(dateStr);
  return !isNaN(parsedDate.getTime());
}

async function getZonesByDepartmentService(deptId, ulbId) {
  if (!deptId) {
    throw new AppError("Department ID (deptId) is required", 400);
  }

  if ((deptId === "21" || deptId === "9") && !ulbId) {
    throw new AppError("Corporation ID (ulbId) is required for this department", 400);
  }

  const data = await repo.getZonesByDepartment(deptId, ulbId);

  let message = "Zones fetched successfully";
  if (data.length === 0) {
    const validDeptIds = ["7", "21", "24", "9"];
    if (!validDeptIds.includes(deptId)) {
      message = "No data found for this department";
    } else {
      message = "No zones found for the selected department";
    }
  }

  return {
    success: true,
    count: data.length,
    list: data,
    message: message
  };
}

async function getCollectionCentersByZoneService(zoneId) {
  if (!zoneId) {
    throw new AppError("Zone ID (zoneId) is required", 400);
  }

  const data = await repo.getCollectionCentersByZone(zoneId);

  return {
    success: true,
    count: data.length,
    list: data,
    message: data.length === 0 ? "No collection centers found for the selected zone" : "Collection centers fetched successfully"
  };
}

async function getChequeReturnListService(deptId, ulbId, zoneId, collCenterId, fromDate, toDate) {
  if (!deptId) {
    throw new AppError("Department ID (deptId) is required", 400);
  }

  if (!ulbId) {
    throw new AppError("Corporation ID (ulbId) is required", 400);
  }

  if (!fromDate) {
    throw new AppError("From date (fromDate) is required in format DD-MON-YYYY", 400);
  }

  if (!toDate) {
    throw new AppError("To date (toDate) is required in format DD-MON-YYYY", 400);
  }

  if (!isValidDate(fromDate)) {
    throw new AppError("Invalid fromDate format. Expected format: DD-MON-YYYY", 400);
  }

  if (!isValidDate(toDate)) {
    throw new AppError("Invalid toDate format. Expected format: DD-MON-YYYY", 400);
  }

  let message = "Cheque return list fetched successfully";
  let data = [];

  if (deptId !== "7" && deptId !== "21") {
    message = "No data found for the selected department";
  } else {
    data = await repo.getChequeReturnList(deptId, ulbId, zoneId, collCenterId, fromDate, toDate);
    
    if (data.length === 0) {
      message = "No records found for the selected criteria";
    }
  }

  return {
    success: true,
    count: data.length,
    list: data,
    message: message
  };
}

module.exports = {
  getZonesByDepartmentService,
  getCollectionCentersByZoneService,
  getChequeReturnListService
};