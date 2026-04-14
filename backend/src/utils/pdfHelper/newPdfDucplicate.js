import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import { PDFDocument } from "pdf-lib";
import { fileURLToPath } from "url";

/* ✅ FIX __dirname (ESM Safe) */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ✅ Convert image to base64 */
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const formatNumber = (n) => {
  if (n === null || n === undefined || n === "") return "0";
  const num = Number(n);
  return isNaN(num) ? "0" : String(num);
};

export const ReportAllPDF = async ({
  asOnDate,
  zoneId,
  wardNo,
  propertyMark,
  propertyType,
  orderBy,
  searchBy,
  balanceRange,
  fromAmount,
  toAmount,
  rows = [],
}) => {
  try {
    if (!rows || rows.length === 0) {
      throw new Error("No records found for the selected criteria");
    }

    /* ==============================
        ✅ Template Path
    ============================== */
    const templatePath = path.resolve(
      __dirname,
      "../../templates/newPdf.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    /* ==============================
        ✅ Logo Base64
    ============================== */
    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");

    let logo = "";
    if (fs.existsSync(logoPath)) {
      logo = imageToBase64(logoPath);
    } else {
      console.warn("⚠️ Logo not found at:", logoPath);
      logo = "https://via.placeholder.com/80";
    }

    const now = new Date();
    const printDate = now.toLocaleDateString("en-GB");
    const printTime = now.toLocaleTimeString("en-IN", { hour12: true });

    /* ==============================
        ✅ Template Data
    ============================== */
    const templateData = {
      logo,
      corporationName: "Nashik Municipal Corporation",
      reportTitle: "Receipt Position Report All (2025-2026)",

      asOnDate: asOnDate ? new Date(asOnDate).toLocaleDateString("en-GB") : "",
      zoneId: zoneId || "ALL",
      wardNo: wardNo || "ALL",
      propertyMark: propertyMark || "ALL",
      propertyType: propertyType || "ALL",
      orderBy: orderBy || "ALL",
      searchBy: searchBy || "ALL",
      balanceRange: balanceRange || "ALL",
      fromAmount: fromAmount || "0",
      toAmount: toAmount || "0",

      printDate,
      printTime,

      rows: rows.map((r, i) => ({
        srNo: r.srNo ?? i + 1,
        zone: r.zone ?? "-",
        noOfProperty: formatNumber(r.noOfProperty),
        arrearsDemand: formatNumber(r.arrearsDemand),
        currentDemand: formatNumber(r.currentDemand),
        totalBalance: formatNumber(r.totalBalance),
        arrearReceipts: formatNumber(r.arrearReceipts),
        currentReceipts: formatNumber(r.currentReceipts),
        excessAmount: formatNumber(r.excessAmount),
        totalReceipt: formatNumber(r.totalReceipt),
        totalNetBalance: formatNumber(r.totalNetBalance),
      })),
    };

    const html = template(templateData);

    /* ==============================
        ✅ Puppeteer Launch
    ============================== */
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await page.close();
    await browser.close();

    /* ==============================
        ✅ Save PDF (same style)
    ============================== */
    const finalPdf = await PDFDocument.create();
    const tempPdf = await PDFDocument.load(pdfBuffer);

    const pages = await finalPdf.copyPages(tempPdf, tempPdf.getPageIndices());
    pages.forEach((p) => finalPdf.addPage(p));

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Receipt_Position_Report_All_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return {
      fileName,
      outputPath,
      downloadUrl: `/pdf/${fileName}`,
    };
  } catch (error) {
    console.error("❌ generateReceiptPositionReportAllPDF error:", error);
    throw error;
  }
};
