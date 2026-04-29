const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./FrmChequeBook.service");
const { ok } = require("../../../libs/response");
const path = require("path");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");

const { generateChequeBookPDF } = require("../../../utils/pdfHelper/FrmChequeBookPDF");

exports.getChequeBookPDF = asyncHandler(async (req, res) => {
  const payload = req.body;

  const data = await service.getChequeBookReport(payload);

  if (!data.length) {
    return res.status(404).json({
      success: false,
      message: "No records found",
    });
  }

  // ✅ SAME AS YOUR SAMPLE
  const corpInfo = await getCorporationService({
    ulbId: payload.ulbId,
  });

  const pdf = await generateChequeBookPDF({
    data,
    filters: payload,

    // ✅ pass only required fields
    corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo.ULBLOGO || "",
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});
