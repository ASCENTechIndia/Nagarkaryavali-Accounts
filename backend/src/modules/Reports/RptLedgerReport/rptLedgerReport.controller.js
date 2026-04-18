const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { RptLedgerReportPDFHelper } = require("../../../utils/pdfHelper/RptLedgerReport");
const service = require("./rptLedgerReport.service");
const path = require("path");

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

exports.generateLedgerPDF = asyncHandler(async (req, res) => {
  try {
    const filters = req.body;

    const transactionsResult =
      await service.getLedgerTransactionsService(filters);

    const balanceResult =
      await service.getAccountBalanceService(filters);

    const transactions = transactionsResult.list || [];
    const openingBalance = balanceResult.balance || 0;

    if (!transactions.length && openingBalance === 0) {
      return res.status(404).json({
        success: false,
        message: "No records found",
      });
    }

    const pdf = await RptLedgerReportPDFHelper({
      transactions,
      openingBalance,
      filters,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

    return res.json({
      success: true,
      message: "Ledger PDF Generated Successfully",
      fileName: pdf.fileName,
      pdfUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "PDF generation failed",
      error: error.message,
    });
  }
});
