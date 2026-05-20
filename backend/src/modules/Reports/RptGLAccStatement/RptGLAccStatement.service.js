const repo = require("./RptGLAccStatement.repo");
const { AppError } = require("../../../libs/errors");

// ================= SUMMARY SERVICE =================
async function getTransactionSummary(filters) {
  if (!filters.functioncode) {
    throw new AppError("functioncode is required", 400);
  }

  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("fromDate and toDate are required", 400);
  }

  const data = await repo.getTransactionSummary(filters);

  if (!data.length) {
    throw new AppError("No data found", 404);
  }

  return data;
}

// ================= DETAILS SERVICE =================
async function getTransactionDetails(filters) {
  if (!filters.functioncode) {
    throw new AppError("functioncode is required", 400);
  }

  if (!filters.fromDate || !filters.toDate) {
    throw new AppError("fromDate and toDate are required", 400);
  }

  const data = await repo.getTransactionDetails(filters);

  if (!data.length) {
    throw new AppError("No data found", 404);
  }

  return data;
}

// ================= SEARCH ACCOUNT HEAD SERVICE =================
async function searchAccountHead({
  ulbId,
  functionCode,
  prefix,
}) {
  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  if (!functionCode) {
    throw new AppError("functionCode is required", 400);
  }

  if (!prefix?.trim()) {
    throw new AppError("prefix is required", 400);
  }

  const data = await repo.searchAccountHead({
    ulbId,
    functionCode,
    prefix: prefix.trim(),
  });

  if (!data.length) {
    throw new AppError("No data found", 404);
  }

  return data;
}

module.exports = {
  getTransactionSummary,
  getTransactionDetails,
  searchAccountHead,
};