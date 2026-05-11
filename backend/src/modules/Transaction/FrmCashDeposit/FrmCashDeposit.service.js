const repo = require("./FrmCashDeposit.repo");
const { AppError } = require("../../../libs/errors");

function isValidDate(dateStr) {
  const dateRegex = /^\d{2}-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/i;
  if (!dateRegex.test(dateStr)) {
    return false;
  }
  const parsedDate = new Date(dateStr);
  return !isNaN(parsedDate.getTime());
}

async function getCashDepositTransactionsService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULB ID is required", 400);
  }
  if (!filters.fromDate) {
    throw new AppError("From date is required in format DD-MON-YYYY", 400);
  }
  if (!filters.toDate) {
    throw new AppError("To date is required in format DD-MON-YYYY", 400);
  }
  if (!isValidDate(filters.fromDate)) {
    throw new AppError("Invalid fromDate format. Expected format: DD-MON-YYYY", 400);
  }
  if (!isValidDate(filters.toDate)) {
    throw new AppError("Invalid toDate format. Expected format: DD-MON-YYYY", 400);
  }

  if (filters.deptId === "7" && filters.zoneId && filters.zoneId !== '-1') {
    if (!filters.collId || filters.collId === '-1' || filters.collId === '0') {
      throw new AppError("Please select Collection Center for Department 7", 400);
    }
  }

  const data = await repo.getCashDepositTransactions(filters);

  return {
    success: true,
    count: data.length,
    list: data,
    message: data.length === 0 ? "No transactions found" : "Transactions fetched successfully"
  };
}

async function getCashDenominationsService() {
  const data = await repo.getCashDenominations();

  return {
    success: true,
    count: data.length,
    list: data,
    message: "Denominations fetched successfully"
  };
}

async function getTapshilReceiptsService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULB ID is required", 400);
  }
  if (!filters.fromDate) {
    throw new AppError("From date is required in format DD-MON-YYYY", 400);
  }
  if (!filters.toDate) {
    throw new AppError("To date is required in format DD-MON-YYYY", 400);
  }
  if (!isValidDate(filters.fromDate)) {
    throw new AppError("Invalid fromDate format. Expected format: DD-MON-YYYY", 400);
  }
  if (!isValidDate(filters.toDate)) {
    throw new AppError("Invalid toDate format. Expected format: DD-MON-YYYY", 400);
  }

  const data = await repo.getTapshilReceipts(filters);

  return {
    success: true,
    count: data.length,
    list: data,
    message: data.length === 0 ? "No receipts found" : "Receipts fetched successfully"
  };
}

async function getLekhashirshDetailsService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULB ID is required", 400);
  }
  if (!filters.fromDate) {
    throw new AppError("From date is required in format DD-MON-YYYY", 400);
  }
  if (!filters.toDate) {
    throw new AppError("To date is required in format DD-MON-YYYY", 400);
  }
  if (!isValidDate(filters.fromDate)) {
    throw new AppError("Invalid fromDate format. Expected format: DD-MON-YYYY", 400);
  }
  if (!isValidDate(filters.toDate)) {
    throw new AppError("Invalid toDate format. Expected format: DD-MON-YYYY", 400);
  }

  const data = await repo.getLekhashirshDetails(filters);

  return {
    success: true,
    count: data.length,
    list: data,
    message: data.length === 0 ? "No account head details found" : "Account head details fetched successfully"
  };
}

async function getCashDepositByRefNoService(
  refNo,
  ulbId,
  hasDenomination = true
) {

  if (!refNo) {
    throw new AppError("Reference number is required", 400);
  }

  if (!ulbId) {
    throw new AppError("ULB ID is required", 400);
  }

  const data = await repo.getCashDepositByRefNo(
    refNo,
    ulbId,
    hasDenomination
  );

  return {
    success: true,
    count: data.length,
    list: data,
    message:
      data.length === 0
        ? "No cash deposit details found"
        : "Cash deposit details fetched successfully"
  };
}

async function saveBankDepositService(depositData) {
  if (!depositData.ulbId) {
    throw new AppError("ULB ID is required", 400);
  }
  if (!depositData.userId) {
    throw new AppError("User ID is required", 400);
  }
  if (!depositData.paramStr) {
    throw new AppError("Receipt master data is required", 400);
  }
  if (!depositData.paramStr1) {
    throw new AppError("Receipt detail data is required", 400);
  }
  if (!depositData.fromDate) {
    throw new AppError("From date is required", 400);
  }
  if (!depositData.toDate) {
    throw new AppError("To date is required", 400);
  }
  if (!isValidDate(depositData.fromDate)) {
    throw new AppError("Invalid fromDate format. Expected format: DD-MON-YYYY", 400);
  }
  if (!isValidDate(depositData.toDate)) {
    throw new AppError("Invalid toDate format. Expected format: DD-MON-YYYY", 400);
  }
  if (depositData.deptId === "7" && depositData.zoneId && depositData.zoneId !== '-1') {
    if (!depositData.collId || depositData.collId === '-1' || depositData.collId === '0') {
      throw new AppError("Please select Collection Center for Department 7", 400);
    }
  }

  const result = await repo.insertBankDeposit({
    userId: depositData.userId,
    ulbId: depositData.ulbId,
    paramStr: depositData.paramStr,
    paramStr1: depositData.paramStr1,
    paramStr2: depositData.paramStr2 || "",
    fromDate: depositData.fromDate,
    toDate: depositData.toDate
  });

  console.log("Service Result: ", result);

  if (!result.success) {
    throw new AppError(result.error, 500);
  }

  if (result.errorCode !== -100) {
    throw new AppError(result.errorMsg || "Failed to save bank deposit", 500);
  }

  return {
    success: true,
    returnStr: result.returnStr,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
    message: "Bank deposit saved successfully"
  };
}

async function saveCashDenominationService(denomData) {
  if (!denomData.userId) {
    throw new AppError("User ID is required", 400);
  }
  if (!denomData.ulbId) {
    throw new AppError("ULB ID is required", 400);
  }
  if (!denomData.deptId) {
    throw new AppError("Department ID is required", 400);
  }
  if (!denomData.denomStr) {
    throw new AppError("Denomination string is required", 400);
  }
  if (!denomData.transNo) {
    throw new AppError("Transaction number is required", 400);
  }
  if (!denomData.receiptNo) {
    throw new AppError("Receipt number is required", 400);
  }

  const result = await repo.insertCashDenominationCashier({
    userId: denomData.userId,
    deptId: denomData.deptId,
    challanNo: denomData.challanNo || "",
    denomDate: denomData.denomDate,
    denomStr: denomData.denomStr,
    transNo: denomData.transNo,
    receiptNo: denomData.receiptNo,
    mode: denomData.mode || 1,
    ulbId: denomData.ulbId
  });

  console.log("Service insertCashDenominationCashier Result: ", result);

  if (!result.success) {
    throw new AppError(result.error, 500);
  }

  if (result.errorCode !== -100) {
    throw new AppError(result.errorMsg || "Failed to save cash denomination", 500);
  }

  return {
    success: true,
    errorCode: result.errorCode,
    errorMsg: result.errorMsg,
    message: "Cash denomination saved successfully"
  };
}

module.exports = {
  getCashDepositTransactionsService,
  getCashDenominationsService,
  getTapshilReceiptsService,
  getLekhashirshDetailsService,
  getCashDepositByRefNoService,
  saveBankDepositService,
  saveCashDenominationService
};