const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { RptLedgerReportPDFHelper } = require("../../../utils/pdfHelper/RptLedgerReport");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
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

const adjustDatesForOpeningBalance = (filters) => {
  const balanceFilters = { ...filters };
  
  if (balanceFilters.fromDate && balanceFilters.toDate) {
    const fromDateParts = balanceFilters.fromDate.split('-');
    const fromDay = parseInt(fromDateParts[0]);
    const fromMonth = fromDateParts[1];
    const fromYear = parseInt(fromDateParts[2]);
    
    const toDateParts = balanceFilters.toDate.split('-');
    const toDay = parseInt(toDateParts[0]);
    const toMonth = toDateParts[1];
    const toYear = parseInt(toDateParts[2]);
    
    const monthMap = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };
    
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const fromDateObj = new Date(fromYear, monthMap[fromMonth], fromDay);
    const previousDayFrom = new Date(fromDateObj);
    previousDayFrom.setDate(previousDayFrom.getDate() - 1);
    const previousDayFromFormatted = `${String(previousDayFrom.getDate()).padStart(2, '0')}-${monthNames[previousDayFrom.getMonth()]}-${previousDayFrom.getFullYear()}`;
  
    const toDateObj = new Date(toYear, monthMap[toMonth], toDay);
    const previousDayTo = new Date(toDateObj);
    previousDayTo.setDate(previousDayTo.getDate() - 1);
    const previousDayToFormatted = `${String(previousDayTo.getDate()).padStart(2, '0')}-${monthNames[previousDayTo.getMonth()]}-${previousDayTo.getFullYear()}`;
    
    balanceFilters.fromDate = previousDayFromFormatted;
    balanceFilters.toDate = previousDayToFormatted;
  }
  
  return balanceFilters;
};

exports.generateLedgerPDF = asyncHandler(async (req, res) => {
  try {
    const filters = req.body;

    const { ulbid } = filters;

    const transactionsResult =
      await service.getLedgerTransactionsService(filters);

    const balanceFilters = adjustDatesForOpeningBalance(filters);
    const balanceResult = await service.getAccountBalanceService(balanceFilters);

    const ulbInfo = await getCorporationService({ulbId: ulbid});

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
      ulbInfo
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
