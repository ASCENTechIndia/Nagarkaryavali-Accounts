const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./rptLedgerReport.service");

exports.getTransactionDetails = asyncHandler(async (req, res) => {
  const transNo = req.body.transno;

  const data = await service.getTransactionDetailsService(transNo);

  return ok(res, data, "Transaction details fetched successfully");
});

exports.getBalance = asyncHandler(async (req, res) => {
  const payload = {
    glcode: req.body.glcode,
    accno: req.body.accno,
    ulbid: req.body.ulbid,
    fromDate: req.body.fromDate,
    toDate: req.body.toDate,
    zoneid: req.body.zoneid || "-1",
  };

  const data = await service.getAccountBalanceService(payload);

  return ok(res, data, "Balance fetched successfully");
});


exports.getLedgerTransactions = asyncHandler(async (req, res) => {
  const payload = {
    glcode: req.body.glcode,
    accno: req.body.accno,
    ulbid: req.body.ulbid,
    fromDate: req.body.fromDate,
    toDate: req.body.toDate,
    zoneid: req.body.zoneid || "-1",
  };

  const data = await service.getLedgerTransactionsService(payload);

  return ok(res, data, "Ledger transactions fetched successfully");
});