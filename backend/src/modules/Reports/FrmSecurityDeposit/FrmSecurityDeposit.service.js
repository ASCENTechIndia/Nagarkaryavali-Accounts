const repo = require("./FrmSecurityDeposit.repo");
const { AppError } = require("../../../libs/errors");

function isValidDate(dateStr) {
  const dateRegex = /^\d{2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/i;
  if (!dateRegex.test(dateStr)) {
    return false;
  }
  
  const parsedDate = new Date(dateStr);
  return !isNaN(parsedDate.getTime());
}

async function getRbtDepReceivedService(corpId, zoneId, fromDate, toDate) {
  if (!corpId) {
    throw new AppError("Corporation ID (corpId) is required", 400);
  }
  
  if (!fromDate) {
    throw new AppError("From date (fromDate) is required in format DD-MMM-YYYY", 400);
  }
  
  if (!toDate) {
    throw new AppError("To date (toDate) is required in format DD-MMM-YYYY", 400);
  }

  if (!isValidDate(fromDate)) {
    throw new AppError("Invalid fromDate format. Expected format: DD-MMM-YYYY", 400);
  }
  
  if (!isValidDate(toDate)) {
    throw new AppError("Invalid toDate format. Expected format: DD-MMM-YYYY", 400);
  }

  const data = await repo.getRbtDepReceived(corpId, zoneId, fromDate, toDate);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getRbtDepoPaymentService(corpId, zoneId, fromDate, toDate) {
  if (!corpId) {
    throw new AppError("Corporation ID (corpId) is required", 400);
  }
  
  if (!fromDate) {
    throw new AppError("From date (fromDate) is required in format DD-MMM-YYYY", 400);
  }
  
  if (!toDate) {
    throw new AppError("To date (toDate) is required in format DD-MMM-YYYY", 400);
  }

  if (!isValidDate(fromDate)) {
    throw new AppError("Invalid fromDate format. Expected format: DD-MMM-YYYY", 400);
  }
  
  if (!isValidDate(toDate)) {
    throw new AppError("Invalid toDate format. Expected format: DD-MMM-YYYY", 400);
  }

  const data = await repo.getRbtDepoPayment(corpId, zoneId, fromDate, toDate);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getRbtUnpaidService(corpId, zoneId, fromDate, toDate) {
  if (!corpId) {
    throw new AppError("Corporation ID (corpId) is required", 400);
  }
  
  if (!fromDate) {
    throw new AppError("From date (fromDate) is required in format DD-MMM-YYYY", 400);
  }
  
  if (!toDate) {
    throw new AppError("To date (toDate) is required in format DD-MMM-YYYY", 400);
  }

  if (!isValidDate(fromDate)) {
    throw new AppError("Invalid fromDate format. Expected format: DD-MMM-YYYY", 400);
  }
  
  if (!isValidDate(toDate)) {
    throw new AppError("Invalid toDate format. Expected format: DD-MMM-YYYY", 400);
  }

  const data = await repo.getRbtUnpaid(corpId, zoneId, fromDate, toDate);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

async function getRdoReport147Service(corpId, zoneId, fromDate, toDate) {
  if (!corpId) {
    throw new AppError("Corporation ID (corpId) is required", 400);
  }
  
  if (!fromDate) {
    throw new AppError("From date (fromDate) is required in format DD-MMM-YYYY", 400);
  }
  
  if (!toDate) {
    throw new AppError("To date (toDate) is required in format DD-MMM-YYYY", 400);
  }

  if (!isValidDate(fromDate)) {
    throw new AppError("Invalid fromDate format. Expected format: DD-MMM-YYYY", 400);
  }
  
  if (!isValidDate(toDate)) {
    throw new AppError("Invalid toDate format. Expected format: DD-MMM-YYYY", 400);
  }

  const data = await repo.getRdoReport147(corpId, zoneId, fromDate, toDate);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}
const getTransactionLedgerService = async (filters) => {
  const data = await repo.getTransactionLedger(filters);

  return {
    success: true,
    count: data.length,
    list: data
  };
};

const getTransactionTypesService = async () => {
  const data = await repo.getTransactionTypes();

  return {
    success: true,
    count: data.length,
    list: data
  };
};

module.exports = {
  getRbtDepReceivedService,
  getRbtDepoPaymentService,
  getRbtUnpaidService,
  getRdoReport147Service,
  getTransactionLedgerService,
  getTransactionTypesService
};