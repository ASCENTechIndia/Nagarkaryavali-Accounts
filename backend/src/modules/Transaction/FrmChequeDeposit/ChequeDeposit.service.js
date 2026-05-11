const repo = require("./ChequeDeposit.repo");
const { AppError } = require("../../../libs/errors");

function isValidDate(dateStr) {
  const dateRegex =
    /^\d{2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/i;

  return dateRegex.test(dateStr);
}


async function getBankDepositSummary(filters) {
  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("From Date and To Date are required", 400);
  }

  if (
    !isValidDate(filters.fromDate) ||
    !isValidDate(filters.toDate)
  ) {
    throw new AppError(
      "Date format should be DD-MON-YYYY",
      400
    );
  }

  return repo.getBankDepositSummary(filters);
}


async function getBankDepositDetails(filters) {
  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("From Date and To Date are required", 400);
  }

  return repo.getBankDepositDetails(filters);
}

async function getChequeDepositDetails(filters) {
  if (!filters.refNo) {
    throw new AppError("Ref No is required", 400);
  }

  return repo.getChequeDepositDetails(filters);
}

async function getZoneList(zoneId) {
  if (!zoneId) {
    throw new AppError("Zone Id is required", 400);
  }

  return repo.getZoneList(zoneId);
}


async function getCollectionCenterList(prabhagId) {
  if (!prabhagId) {
    throw new AppError("Prabhag Id is required", 400);
  }

  return repo.getCollectionCenterList(prabhagId);
}

async function saveCashierReceipt(data) {
  if (!data.userId) {
    throw new AppError("User Id is required", 400);
  }

  if (!data.ulbId) {
    throw new AppError("ULB Id is required", 400);
  }

  if (!data.paramStr) {
    throw new AppError("ParamStr is required", 400);
  }

  if (!data.paramStr2) {
    throw new AppError("ParamStr2 is required", 400);
  }

  if (
    !isValidDate(data.fromDate) ||
    !isValidDate(data.toDate)
  ) {
    throw new AppError(
      "Date format should be DD-MON-YYYY",
      400
    );
  }

  const result = await repo.saveCashierReceipt(data);

  if (result.errorCode !== -100) {
    throw new AppError(result.errorMsg, 400);
  }

  return result;
}
module.exports = {
  getBankDepositSummary,
  getBankDepositDetails,
  getChequeDepositDetails,
  getZoneList,
  getCollectionCenterList,
  saveCashierReceipt
};