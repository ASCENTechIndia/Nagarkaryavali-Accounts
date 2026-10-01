const asyncHandler = require("../../../libs/asyncHandler");
const path = require("path");
const service = require("./RptConsolidateReport.service");
const {
  RptConsolidateReportPDFHelper,
} = require("../../../utils/pdfHelper/RptConsolidateReport");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");

exports.generateConsolidateChallanPDF = asyncHandler(async (req, res) => {
  try {
    const filters = req.body;
    const { ulbId, fromDate, toDate } = filters;
    const transactions = await service.getConsolidateChallanData(filters);
    const ulbInfo = await getCorporationService({ ulbId: ulbId });

    if (!transactions.length) {
      return res.status(404).json({
        success: false,
        message: "No records found",
      });
    }

    const pdf = await RptConsolidateReportPDFHelper({
      transactions,
      filters,
      ulbInfo,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

    return res.json({
      success: true,
      message: "Consolidate Challan PDF Generated Successfully",
      fileName: pdf.fileName,
      pdfUrl,
    });
  } catch (error) {
    console.error("Consolidate Challan PDF Error:", error);
    res.status(500).json({
      success: false,
      message: "PDF generation failed",
      error: error.message,
    });
  }
});
