const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./frmPayment.service");

exports.getFrmPayment = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { zoneId, ulbId } = req.body;

  if (!zoneId) {
    throw new AppError("zoneId is required", 400);
  }
  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }
  const payload = { zoneId, ulbId };
  const data = await service.getFrmPaymentService(payload);
  return ok(res, data, "FrmPayment fetched successfully");
});

exports.getTransactionTypes = asyncHandler(async (req, res) => {
  console.log("📥 Request: Get Transaction Types");

  const data = await service.getTransactionTypeService();

  return ok(res, data, "Transaction types fetched successfully");
});

exports.getPartyMaster = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { ulbId } = req.body;

  // 🔥 Validation
  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const payload = { ulbId };

  const data = await service.getPartyMasterService(payload);

  return ok(res, data, "Party master fetched successfully");
});

exports.getAccountDetails = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { glcode, accno } = req.body;

  // 🔥 Validation
  if (!glcode) {
    throw new AppError("glcode is required", 400);
  }

  if (!accno) {
    throw new AppError("accno is required", 400);
  }

  const payload = { glcode, accno };

  const data = await service.getAccountDetailsService(payload);

  return ok(res, data, "Account details fetched successfully");
});

exports.getSecurityDeposit = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);
  const { partyId, glcode, accno, ulbId } = req.body;
  if (!partyId) {
    throw new AppError("partyId is required", 400);
  }
  if (!glcode) {
    throw new AppError("glcode is required", 400);
  }
  if (!accno) {
    throw new AppError("accno is required", 400);
  }
  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const payload = { partyId, glcode, accno, ulbId };
  const data = await service.getSecurityDepositService(payload);
  return ok(res, data, "Security deposit fetched successfully");
});

exports.getPaymentTypes = asyncHandler(async (req, res) => {
  console.log("📥 Request: Get Payment Types");

  const data = await service.getPaymentTypesService();

  return ok(res, data, "Payment types fetched successfully");
});

exports.getAdvancePaymentType = asyncHandler(async (req, res) => {
  console.log("📥 Request: Get Advance Payment Type");

  const data = await service.getAdvancePaymentTypeService();

  return ok(res, data, "Advance payment type fetched successfully");
});

exports.getPaymentDetails = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { refno } = req.body;

  if (!refno) {
    throw new AppError("refno is required", 400);
  }

  const payload = { refno };

  const data = await service.getPaymentDetailsService(payload);

  return ok(res, data, "Payment details fetched successfully");
});

exports.searchAccount = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { ulbid, searchText, functionCode } = req.body;

  if (!ulbid) {
    throw new AppError("ulbid is required", 400);
  }
  if (!functionCode) {
    throw new AppError("functionCode is required", 400);
  }

//   if (!searchText) {
//     throw new AppError("searchText is required", 400);
//   }

  const payload = { ulbid, searchText, functionCode };

  const data = await service.searchAccountService(payload);

  return ok(res, data, "Accounts fetched successfully");
});

exports.getAccountBalance = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { targetDate, corpId, ulbid } = req.body;

  if (!targetDate) {
    throw new AppError("targetDate is required", 400);
  }

  if (!corpId) {
    throw new AppError("corpId is required", 400);
  }

  if (!ulbid) {
    throw new AppError("ulbid is required", 400);
  }

  const payload = { targetDate, corpId, ulbid };

  const data = await service.getAccountBalanceService(payload);

  return ok(res, data, "Account balance fetched successfully");
});

exports.getCorporationById = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { corpId } = req.body;

  if (!corpId) {
    throw new AppError("corpId is required", 400);
  }

  const payload = { corpId };

  const data = await service.getCorporationByIdService(payload);

  return ok(res, data, "Corporation fetched successfully");
});

exports.getPaymentDetailsView = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);
  const { refno, ulbid } = req.body;

  if (!refno) {
    throw new AppError("refno is required", 400);
  }
  if (!ulbid) {
    throw new AppError("ulbid is required", 400);
  }

  const payload = { refno, ulbid };
  const data = await service.getPaymentDetailsViewService(payload);
  return ok(res, data, "Payment details fetched successfully");
});

exports.savePayment = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { paramStr, paramStr2, paramStr3, userId, zoneId } = req.body;

  // 🔥 Validations
  if (!paramStr) {
    throw new AppError("paramStr is required", 400);
  }

  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  if (!zoneId) {
    throw new AppError("zoneId is required", 400);
  }

  const payload = {
    paramStr,
    paramStr2,
    paramStr3,
    userId,
    zoneId,
  };

  const data = await service.savePaymentService(payload);

  return ok(res, data, "Payment operation executed successfully");
});
