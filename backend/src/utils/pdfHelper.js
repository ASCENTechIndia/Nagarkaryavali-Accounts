// import fs from "fs";
// import path from "path";
// import puppeteer from "puppeteer"; // ✅ puppeteer (not puppeteer-core)
// import Handlebars from "handlebars";
// import { PDFDocument } from "pdf-lib";
// import QRCode from "qrcode";
// import { fileURLToPath } from "url";

// /* ✅ FIX __dirname (ESM Safe) */
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /* ✅ Chunk helper */
// export const chunkArray = (array, size) => {
//   const chunks = [];
//   for (let i = 0; i < array.length; i += size) {
//     chunks.push(array.slice(i, i + size));
//   }
//   return chunks;
// };

// /* ✅ Convert image to base64 */
// export const imageToBase64 = (imgPath) => {
//   const file = fs.readFileSync(imgPath);
//   const ext = path.extname(imgPath).replace(".", "");
//   return `data:image/${ext};base64,${file.toString("base64")}`;
// };

// /* ✅ Generate Daily Collection PDF */
// export const generateDailyCollectionPDF = async ({
//   receipts = [],
//   corporationName = "मिरा भाईंदर महानगरपालिका, मिरा भाईंदर",
//   fromDate,
//   toDate,
//   collectionCenter,
//   userName,
// }) => {
//   try {
//     /* ==============================
//         ✅ Template Path (Correct)
//     ============================== */
//     const templatePath = path.resolve(
//       __dirname,
//       "../templates/daily-collection-report.html"
//     );

//     if (!fs.existsSync(templatePath)) {
//       throw new Error(`Template not found at: ${templatePath}`);
//     }

//     const templateHtml = fs.readFileSync(templatePath, "utf8");
//     const template = Handlebars.compile(templateHtml);

//     /* ==============================
//         ✅ Logo Base64
//     ============================== */
//     const logoPath = path.resolve(__dirname, "../../NMC_Logo.jpeg");

//     let logo = "";
//     if (fs.existsSync(logoPath)) {
//       logo = imageToBase64(logoPath);
//     } else {
//       console.warn("⚠️ Logo not found at:", logoPath);
//     }

//     /* ==============================
//         ✅ QR CODE Base64
//     ============================== */
//     const qrCode = await QRCode.toDataURL(
//       `DailyReport|${collectionCenter}|${fromDate}|${toDate}`
//     );

//     /* ==============================
//         ✅ Detect Installed Chrome (Windows)
//     ============================== */
//     let chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

//     if (!fs.existsSync(chromePath)) {
//       chromePath =
//         "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
//     }

//     // ✅ If chrome not installed, fallback to puppeteer bundled chrome
//     const launchOptions = {
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     };

//     if (fs.existsSync(chromePath)) {
//       launchOptions.executablePath = chromePath;
//     } else {
//       console.warn(
//         "⚠️ Google Chrome not found. Puppeteer will use bundled Chromium."
//       );
//     }

//     const browser = await puppeteer.launch(launchOptions);

//     /* ==============================
//         ✅ Final PDF Merge Document
//     ============================== */
//     const finalPdf = await PDFDocument.create();

//     /* ✅ Batch size for chunking pages */
//     const BATCH_SIZE = 15;
//     const chunks = chunkArray(receipts, BATCH_SIZE);

//     let pageNumber = 1;

//     for (const chunk of chunks) {
//       const totalAmount = chunk.reduce(
//         (sum, item) => sum + Number(item.amount || 0),
//         0
//       );

//       const batchData = {
//         corporationName,
//         fromDate,
//         toDate,
//         collectionCenter,
//         userName,

//         bankName: "BANK OF BARODA MIRA BHAYANDER",
//         currentDate: new Date().toLocaleDateString("en-GB"),

//         accountNo: "0",
//         codeNo: "0",
//         pageNumber,

//         logo,
//         qrCode,

//         receipts: chunk.map((r, i) => ({
//           srNo: (pageNumber - 1) * BATCH_SIZE + (i + 1),
//           propertyNo: r.propertyNo || "-",
//           ownerName: r.ownerName || "-",
//           chequeNo: r.chequeNo || "-",
//           chequeDate: r.chequeDate || "-",
//           bank: r.bank || "-",
//           receiptNo: r.receiptNo || "-",
//           amount: (r.amount || "0").toString(),
//           stamp: r.stamp || "1",
//           remark: r.remark || "",
//         })),

//         totalReceipts: chunk.length,
//         totalAmount: totalAmount.toLocaleString("en-IN"),
//       };

//       const html = template(batchData);

//       const page = await browser.newPage();

//       await page.setContent(html, {
//         waitUntil: "domcontentloaded",
//         timeout: 0,
//       });

//       /* ✅ Generate PDF (Landscape A4) */
//       const pdfBuffer = await page.pdf({
//         format: "A4",
//         landscape: true, // ✅ THIS MAKES IT LANDSCAPE
//         printBackground: true,
//         margin: {
//           top: "10mm",
//           bottom: "10mm",
//           left: "10mm",
//           right: "10mm",
//         },
//       });

//       /* ✅ Merge into final pdf */
//       const tempPdf = await PDFDocument.load(pdfBuffer);
//       const pages = await finalPdf.copyPages(tempPdf, tempPdf.getPageIndices());
//       pages.forEach((p) => finalPdf.addPage(p));

//       await page.close();
//       pageNumber++;
//     }

//     await browser.close();

//     /* ==============================
//         ✅ Save PDF File
//     ============================== */
//     const outputDir = path.resolve(__dirname, "../../generated-pdfs");

//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     const fileName = `DailyCollection_${Date.now()}.pdf`;
//     const outputPath = path.join(outputDir, fileName);

//     const finalBytes = await finalPdf.save();
//     fs.writeFileSync(outputPath, finalBytes);

//     return {
//       fileName,
//       outputPath,
//     };
//   } catch (error) {
//     console.error("❌ PDF generation error:", error);
//     throw error;
//   }
// };
