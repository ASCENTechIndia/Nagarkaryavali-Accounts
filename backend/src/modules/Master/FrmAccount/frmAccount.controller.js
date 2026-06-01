const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./frmAccount.service");

exports.getAccountDetails = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);
  const { functionCode, ulbId, objectCode } = req.body;

  if (!functionCode) {
    throw new AppError("जी.एल. नांव is required", 400);
  }
  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }
  if (!objectCode) {
    throw new AppError("खाते नांव is required", 400);
  }

  const payload = { functionCode, ulbId, objectCode };
  const data = await service.getAccountDetailsService(payload);
  return ok(res, data, "Account details fetched successfully");
});

exports.searchAccount = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);
  const { prefix, ulbId, functionCode } = req.body;

  if (!prefix) {
    throw new AppError("prefix is required", 400);
  }
  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const payload = { prefix, ulbId, functionCode };
  const data = await service.searchAccountService(payload);
  return ok(res, data, "Account search fetched successfully");
});

exports.searchGL = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { prefix } = req.body;
  if (!prefix) {
    throw new AppError("prefix is required", 400);
  }

  const payload = { prefix };
  const data = await service.searchGLService(payload);
  return ok(res, data, "GL search fetched successfully");
});

exports.getGLMasterList = asyncHandler(async (req, res) => {
  console.log("📥 Request: Fetch GL Master List");

  const data = await service.getGLMasterListService();

  return ok(res, data, "GL Master list fetched successfully");
});

exports.getAccountTypes = asyncHandler(async (req, res) => {
  console.log("📥 Request: Fetch Account Types");
  const data = await service.getAccountTypeService();
  return ok(res, data, "Account types fetched successfully");
});

exports.getAccountSubTypes = asyncHandler(async (req, res) => {
  console.log("📥 Request: Fetch Account Subtypes");
  const data = await service.getAccountSubTypeService();
  return ok(res, data, "Account subtypes fetched successfully");
});

exports.getReportHeads = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { reportCode } = req.body;
  if (!reportCode) {
    throw new AppError("reportCode is required", 400);
  }

  const payload = {
    reportCode: reportCode,
  };
  const data = await service.getReportHeadsService(payload);
  return ok(res, data, "Report heads fetched successfully");
});

exports.getBankMaster = asyncHandler(async (req, res) => {
  console.log("📥 Request: Fetch Bank Master");
  const data = await service.getBankMasterService();
  return ok(res, data, "Bank master fetched successfully");
});

exports.getNidhiMaster = asyncHandler(async (req, res) => {
  console.log("📥 Request: Fetch Nidhi Master");
  const data = await service.getNidhiMasterService();
  return ok(res, data, "Nidhi master fetched successfully");
});

exports.getAccountFullDetails = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);
  const { functionCode, accNo, ulbId } = req.body;
  if (!functionCode) {
    throw new AppError("functionCode is required", 400);
  }
  if (!accNo) {
    throw new AppError("accNo is required", 400);
  }
  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const payload = { functionCode, accNo, ulbId };
  const data = await service.getAccountFullDetailsService(payload);
  return ok(res, data, "Account full details fetched successfully");
});

exports.getAccountZoneDetails = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { accId } = req.body;

  if (!accId) {
    throw new AppError("accId is required", 400);
  }
  const payload = { accId };
  const data = await service.getAccountZoneDetailsService(payload);
  return ok(res, data, "Account zone details fetched successfully");
});

exports.getAccountMappingDetails = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);
  const { glCode, accNo } = req.body;
  if (!glCode) {
    throw new AppError("glCode is required", 400);
  }
  if (!accNo) {
    throw new AppError("accNo is required", 400);
  }

  const payload = { glCode, accNo };
  const data = await service.getAccountMappingDetailsService(payload);
  return ok(res, data, "Account mapping details fetched successfully");
});

exports.getNextAccountNo = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { ulbId, glCode, subTypeId } = req.body;

  if (!ulbId) throw new AppError("ulbId is required", 400);
  if (!glCode) throw new AppError("glCode is required", 400);
  if (!subTypeId) throw new AppError("subTypeId is required", 400);

  const payload = { ulbId, glCode, subTypeId };

  const data = await service.getNextAccountNoService(payload);

  return ok(res, data, "Next account number fetched successfully");
});

exports.getZoneList = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { corpId } = req.body;

  if (!corpId) {
    throw new AppError("corpId is required", 400);
  }

  const payload = { corpId };

  const data = await service.getZoneListService(payload);

  return ok(res, data, "Zone list fetched successfully");
});

exports.saveAccountMaster = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const {
    ulbId,
    glCode,
    accNo,
    accName,
    accNameEng,
    userId,
    mode,
    subTypeId,
    oldAccNo,
    nidhiId,
    openingBal,
    budgetAmt,
    maxLimit,
    revBudgetAmt,
  } = req.body;

  if (!mode) throw new AppError("mode is required (1=insert,2=update,3=delete)", 400);
  if (!userId) throw new AppError("userId is required", 400);
  if (!accName) throw new AppError("accName is required", 400);

  const payload = {
    ulbId,
    glCode,
    accNo,
    accName,
    accNameEng,
    userId,
    mode,
    subTypeId,
    oldAccNo,
    nidhiId,
    openingBal,
    budgetAmt,
    maxLimit,
    revBudgetAmt,
  };

  const data = await service.saveAccountMasterService(payload);

  return ok(res, data, "Procedure executed successfully");
});

exports.getFilteredAccSubType = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { accType, balanceSheetGroup } = req.body;

  if (!accType) {
    throw new AppError("accType is required", 400);
  }

  if (!balanceSheetGroup) {
    throw new AppError("balanceSheetGroup is required", 400);
  }

  const payload = { accType, balanceSheetGroup };

  const data = await service.getFilteredAccSubTypeService(payload);

  return ok(res, data, "Filtered account subtypes fetched successfully");
});