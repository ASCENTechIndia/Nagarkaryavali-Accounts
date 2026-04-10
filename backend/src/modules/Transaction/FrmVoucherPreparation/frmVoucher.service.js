const repo = require("./frmVoucher.repo");
const { AppError } = require("../../../libs/errors");

/* helper */
function validateRequired(fields, payload) {
  const missing = fields.filter(f => !payload[f]);
  if (missing.length) {
    throw new AppError(`${missing.join(", ")} is required`, 400);
  }
}

/* 1 */
async function getPendingVouchersService(payload) {
  validateRequired(["zoneId", "ulbId"], payload);
  const data = await repo.getPendingVouchersRepo(payload);
  return { success: true, count: data.length, data };
}

/* 2 */
async function getDepositeDropdownService(payload) {
  validateRequired(["ulbId"], payload);
  const data = await repo.getDepositeDropdownRepo(payload);
  return { success: true, count: data.length, data };
}

/* 3 */
async function getSectionDropdownService() {
  const data = await repo.getSectionDropdownRepo();
  return { success: true, count: data.length, data };
}

/* 4 */
async function getBudgetHeadService(payload) {
  validateRequired(["budgetLevel"], payload);
  const data = await repo.getBudgetHeadRepo(payload);
  return { success: true, count: data.length, data };
}

/* 5 */
async function getBankDetailsService(payload) {
  validateRequired(["bankID"], payload);
  const data = await repo.getBankDetailsRepo(payload);
  return { success: true, count: data.length, data };
}

/* 6 */
async function getVoucherDetailsService(payload) {
  validateRequired(["refno", "zoneid", "ulbid"], payload);
  const data = await repo.getVoucherDetailsRepo(payload);
  return { success: true, count: data.length, data };
}

/* 7 */
async function getVoucherDetailLinesService(payload) {
  validateRequired(["refno", "ulbid"], payload);
  const data = await repo.getVoucherDetailLinesRepo(payload);
  return { success: true, count: data.length, data };
}

/* 8 */
async function getAccountByGlAccService(payload) {
  validateRequired(["glcode", "accno"], payload);
  const data = await repo.getAccountByGlAccRepo(payload);
  return { success: true, count: data.length, data };
}

/* 9 */
async function getSecDepositCodeService(payload) {
  validateRequired(["glcode", "accno", "ulbid"], payload);
  const data = await repo.getSecDepositCodeRepo(payload);
  return { success: true, count: data.length, data };
}

/* 10 */
async function getAccountByFunctionService(payload) {
  validateRequired(["functioncode", "objectcode", "ulbid"], payload);
  const data = await repo.getAccountByFunctionRepo(payload);
  return { success: true, count: data.length, data };
}

/* 11 */
async function getCorporationCodeService(payload) {
  validateRequired(["corporationId"], payload);
  const data = await repo.getCorporationCodeRepo(payload);
  return { success: true, count: data.length, data };
}

/* 12 */
async function getContractsService(payload) {
  validateRequired(["contractorid", "zoneid"], payload);
  const data = await repo.getContractsRepo(payload);
  return { success: true, count: data.length, data };
}

/* 13 */
async function getContractAccYearService(payload) {
  validateRequired(["contractid"], payload);
  const data = await repo.getContractAccYearRepo(payload);
  return { success: true, count: data.length, data };
}

/* 14 */
async function getPartyBankDetailsService(payload) {
  validateRequired(["partyid"], payload);
  const data = await repo.getPartyBankDetailsRepo(payload);
  return { success: true, count: data.length, data };
}

/* 15 */
async function getPartyTaxDetailsService(payload) {
  validateRequired(["partyid", "ulbid"], payload);
  const data = await repo.getPartyTaxDetailsRepo(payload);
  return { success: true, count: data.length, data };
}

/* 16 */
async function getNidhiConfigService(payload) {
  validateRequired(["budgetid", "ulbid", "nidhiFlag"], payload);
  const data = await repo.getNidhiConfigRepo(payload);
  return { success: true, count: data.length, data };
}

/* 17 */
async function getGovtTaxAccService(payload) {
  validateRequired(["accsubtype"], payload);
  const data = await repo.getGovtTaxAccRepo(payload);
  return { success: true, count: data.length, data };
}

/* 18 */
async function getVoucherReceiptDetailsService(payload) {
  validateRequired(["refno", "ulbid"], payload);
  const data = await repo.getVoucherReceiptDetailsRepo(payload);
  return { success: true, count: data.length, data };
}

async function saveVoucherService(payload) {
  console.log("📥 Service: Save Voucher", payload);

  return await repo.saveVoucherRepo(payload);
}


module.exports = {
  getPendingVouchersService,
  getDepositeDropdownService,
  getSectionDropdownService,
  getBudgetHeadService,
  getBankDetailsService,
  getVoucherDetailsService,
  getVoucherDetailLinesService,
  getAccountByGlAccService,
  getSecDepositCodeService,
  getAccountByFunctionService,
  getCorporationCodeService,
  getContractsService,
  getContractAccYearService,
  getPartyBankDetailsService,
  getPartyTaxDetailsService,
  getNidhiConfigService,
  getGovtTaxAccService,
  getVoucherReceiptDetailsService,
  saveVoucherService
};