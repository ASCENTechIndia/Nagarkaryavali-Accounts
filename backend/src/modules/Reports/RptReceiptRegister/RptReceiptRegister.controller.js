const service = require("./RptReceiptRegister.service");
const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const path = require("path");

const { RptReceiptRegisterPDFHelper } = require("../../../utils/pdfHelper/RptReceiptRegister");
const { getCorporationInfoService } = require("../../MenuAccess/MenuAccess.service");

const getReceiptRegister = asyncHandler(async (req, res) => {
  const result = await service.getReceiptRegisterService(req.body);

  if (!result.rows || result.rows.length === 0) {
    return res.json({
      success: false,
      message: "No records found",
      data: result
    });
  }

  res.json({
    success: true,
    message: "Receipt register fetched successfully",
    data: result
  });
});

// const generateReceiptRegPDF = asyncHandler(async (req, res) => {
//   try {
//     const filters = req.body;

//     const result = await service.getReceiptRegisterService(filters);

//     if (!result.rows.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No records found"
//       });
//     }

//     const pdf = await RptReceiptRegisterPDFHelper({
//       reportData: result.rows,
//       filters
//     });

//     const baseUrl = `${req.protocol}://${req.get("host")}`;
//     const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

//     return res.json({
//       success: true,
//       message: "PDF Generated Successfully",
//       fileName: pdf.fileName,
//       pdfUrl
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "PDF generation failed",
//       error: error.message
//     });
//   }
// });


const generateReceiptRegPDF = asyncHandler(async (req, res) => {
  try {
    const filters = req.body;

    const result = await service.getReceiptRegisterService(filters);
    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "No records found"
      });
    }

    // 🔥 Fetch corporation info using ulbId from filters
    const corpInfo = await getCorporationInfoService({ ulbId: filters.ulbId });

    // since your service returns object (not array)
    const corporationName = corpInfo.data?.corporationName || "";
    const corporationLogo = corpInfo.data?.corporationLogo || "";


    const pdf = await RptReceiptRegisterPDFHelper({
      reportData: result.rows,
      filters,
      corporationName,
      corporationLogo
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

    return res.json({
      success: true,
      message: "PDF Generated Successfully",
      fileName: pdf.fileName,
      pdfUrl
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "PDF generation failed",
      error: error.message
    });
  }
});


module.exports = { getReceiptRegister, generateReceiptRegPDF };