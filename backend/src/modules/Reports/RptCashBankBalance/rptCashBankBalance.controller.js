const { AppError } = require("../../../libs/errors");
const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./rptCashBankBalance.service");
const path = require("path");
const { CashbookPDFHelper } = require("../../../utils/pdfHelper/CashbookPDFHelper");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");

exports.getGrampanchayatList = asyncHandler(async (req, res) => {
  const { deptId } = req.body;

  if (!deptId) {
    throw new AppError("deptId is required", 400);
  }

  const data = await service.getGrampanchayatListService({ deptId });

  return ok(res, data, "Grampanchayat List fetched successfully");
});

exports.getCashBankBalanceReport = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { asOnDate, zoneId, ulbId } = req.body;

  if (!asOnDate) throw new AppError("asOnDate is required", 400);
  if (!zoneId) throw new AppError("zoneId is required", 400);
  if (!ulbId) throw new AppError("ulbId is required", 400);

  const payload = { asOnDate, zoneId, ulbId };

  const data = await service.getCashBankBalanceReportService(payload);

  return ok(res, data, "Cash Bank Balance Report fetched successfully");
});

exports.getDailyTransactionDetailedReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getDailyTransactionDetailedReportService(filters);

  return ok(res, data, "Daily transaction detailed report fetched");
});

exports.getOpeningBalance = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { ulbId, date, zone } = req.body;

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  if (!date) {
    throw new AppError("date is required", 400);
  }

  const payload = { 
    ulbId, 
    date, 
    zone: zone || "-1" 
  };

  const data = await service.getOpeningBalanceService(payload);

  return ok(res, data, "Opening balance fetched successfully");
});

exports.getTransactionDetails = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);
  
  const { transno, transType, ulbId } = req.body;
  
  if (!transno) {
    throw new AppError("Transaction number (transno) is required", 400);
  }
  
  if (!transType) {
    throw new AppError("Transaction type (transType) is required", 400);
  }
  
  if (!ulbId) {
    throw new AppError("ULB ID (ulbId) is required", 400);
  }
  
  const data = await service.getTransactionDetailsService(transno, transType, ulbId);
  
  return ok(res, data, "Transaction details fetched successfully");
});

exports.generateCashbookPDF = asyncHandler(async (req, res) => {
  const filters = req.body;
  
  const prevDate = new Date(filters.date);
  prevDate.setDate(prevDate.getDate() - 1);
  
  const day = String(prevDate.getDate()).padStart(2, "0");
  const month = prevDate.toLocaleString("en", { month: "short" }).toUpperCase();
  const year = prevDate.getFullYear();
  const prevDateFormatted = `${day}-${month}-${year}`;
  
  const openingBalancePayload = {
    ulbId: filters.ulbId,
    date: prevDateFormatted,
    zone: filters.zone || "-1"
  };
  
  const openingBalanceResult = await service.getOpeningBalanceService(openingBalancePayload);
  
  const transactionResult = await service.getDailyTransactionDetailedReportService(filters);

  const ulbInfo = await getCorporationService(filters);
  
  if (!transactionResult.list.length) {
    return res.status(404).json({
      success: false,
      message: "No records found"
    });
  }
  
  console.log("Opening Balance Data:", openingBalanceResult);
  console.log("Transaction Data Count:", transactionResult.list.length);
  
  const pdf = await CashbookPDFHelper({
    reportData: transactionResult.list,
    openingBalanceData: openingBalanceResult,
    filters: {
      date: filters.date,
      ulbId: filters.ulbId,
      zone: filters.zone
    },
    ulbInfo
  });
  
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;
  
  return res.json({
    success: true,
    message: "PDF Generated Successfully",
    fileName: pdf.fileName,
    pdfUrl
  });
});