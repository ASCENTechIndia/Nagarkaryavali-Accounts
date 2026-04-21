import { generatePaymentRegisterPDF } from "../../../utils/pdfHelper/generatePaymentRegisterPDF.js";
import asyncHandler from "../../../libs/asyncHandler.js";
import * as service from "./RptPaymentRegister.service.js";

export const getPaymentRegister = asyncHandler(async (req, res) => {
  try {
    const result = await service.getPaymentRegisterService(req.body);

    // ✅ Safe check
    if (!result?.rows || result.rows.length === 0) {
      return res.json({
        success: false,
        message: "No Data Found",
      });
    }

    // ✅ Generate PDF
    const { fileName } = await generatePaymentRegisterPDF({
      rows: result.rows,
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      majorCode: req.body.majorCode,
      zone: req.body.zoneId,
    });

    // 🔥 Build FULL URL dynamically
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return res.json({
      success: true,
      pdfUrl: `${baseUrl}/pdf/${fileName}`,
    });

  } catch (error) {
    console.error("Payment Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});