const service = require("./FrmTransactionEntryStatusRpt.service");
const asyncHandler = require("../../../libs/asyncHandler");
const path = require("path");

const {
  TransactionEntryStatusPDFHelper,
} = require("../../../utils/pdfHelper/TransactionEntryStatus");

const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");


const getUserList = asyncHandler(async (req, res) => {
  const response = await service.getUserListService(req.body);
  res.json(response);
});


const getTransactionEntryStatusReport = asyncHandler(async (req, res) => {
  const result = await service.getTransactionEntryStatusReportService(req.body);

  if (result.rowCount == 0){
    return res.json({
      success: false,
      message: "No records found",
      data: result,
    });
  }

  return res.json({
    success: true,
    message: "Report fetched successfully",
    data: result,
  });
});

const generateTransactionEntryStatusPDF = asyncHandler(async (req, res) => {
  try {
    const filters = req.body;

    const result =
      await service.getTransactionEntryStatusReportService(filters);

    if (result.rowCount == 0) {
      return res.status(404).json({
        success: false,
        message: "No records found",
      });
    }

    const corpInfo = await getCorporationService({
      ulbId: filters.ulbId,
    });

    const corporationName = corpInfo.ABC_MUNICIPAL_TEXT || "";
     const corporationLogo = corpInfo.ULBLOGO || "";

    const pdf = await TransactionEntryStatusPDFHelper({
      reportData: result.rows,
      filters,
      corporationName,
      corporationLogo,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

    return res.json({
      success: true,
      message: "PDF Generated Successfully",
      fileName: pdf.fileName,
      pdfUrl,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "PDF Generation Failed",
      error: error.message,
    });
  }
});

module.exports = {
  getUserList,
  getTransactionEntryStatusReport,
  generateTransactionEntryStatusPDF,
};