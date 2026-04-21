import { generatePaymentRegisterPDF } from "../../../utils/pdfHelper/generatePaymentRegisterPDF.js";
import asyncHandler from "../../../libs/asyncHandler.js";
import * as service from "./RptPaymentRegister.service.js";
import axios from "axios";

export const getPaymentRegister = asyncHandler(async (req, res) => {
  try {
    const result = await service.getPaymentRegisterService(req.body);

    if (!result?.rows || result.rows.length === 0) {
      return res.json({
        success: false,
        message: "No Data Found",
      });
    }

    // ✅ FETCH CORPORATION INFO
    const baseUrl = `${req.protocol}://${req.get("host")}`;

  const corpRes = await axios.post(
  `${baseUrl}/api/menu-access/CorporationInfo`,
  { ulbId: req.body.ulbId },
  {
    headers: {
      Authorization: req.headers.authorization, // 🔥 FIX
    },
  }
);

    const corpData = corpRes.data?.data || {};

    // ✅ Generate PDF with dynamic values
    const { fileName } = await generatePaymentRegisterPDF({
      rows: result.rows,
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      majorCode: req.body.majorCode,
      zone: req.body.zoneId,

      // 🔥 DYNAMIC VALUES
      corporationName: corpData.ABC_MUNICIPAL_TEXT,
      logo: corpData.ULBLOGO,
    });

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