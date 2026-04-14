// const fs = require("fs");
// const path = require("path");
// const puppeteer = require("puppeteer");
// const Handlebars = require("handlebars");
// const { PDFDocument } = require("pdf-lib");

// const imageToBase64 = (imgPath) => {
//   try {
//     const file = fs.readFileSync(imgPath);
//     const ext = path.extname(imgPath).replace(".", "");
//     return `data:image/${ext};base64,${file.toString("base64")}`;
//   } catch (error) {
//     console.error("Error converting image to base64:", error);
//     return "";
//   }
// };

// /**
//  * Generate Receipt Details Report PDF
//  * @param {Object} params
//  * @param {Array} params.receipts - Receipt details for Table 1
//  * @param {Object} params.totals - Grand total summary for Table 2
//  * @param {Array} params.userSummary - User-wise summary for Table 3
//  * @param {String} params.receiptDate - Date of receipts
//  * @param {String} params.collectionCenter - Collection center name
//  * @param {String} params.printDate - Print date
//  * @param {String} params.corporationName - Corporation name
//  * @param {String} params.username - Username who generated report
//  */
// const generateReceiptDetailsReportPDF = async ({
//   receipts = [],
//   totals = {},
//   userSummary = [],
//   receiptDate = "",
//   collectionCenter = "",
//   printDate = "",
//   corporationName = "Nashik Municipal Corporation",
//   username = "User"
// }) => {
//   try {
//     if (!receipts || receipts.length === 0) {
//       throw new Error("No receipt data provided");
//     }

//     // Template path
//     const templatePath = path.resolve(__dirname, "../../templates/receipt-details-report.html");
//     if (!fs.existsSync(templatePath)) {
//       throw new Error(`Template not found at: ${templatePath}`);
//     }

//     // Read and compile template
//     const templateHtml = fs.readFileSync(templatePath, "utf8");
//     const template = Handlebars.compile(templateHtml);

//     // Get logo
//     const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
//     const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

//     // Register Handlebars helpers
//     Handlebars.registerHelper('formatNumber', function(value) {
//       if (value === undefined || value === null) return '0.00';
//       const num = parseFloat(value);
//       return isNaN(num) ? '0.00' : num.toFixed(2);
//     });

//     // Prepare data for template
//     const reportData = {
//       logo,
//       corporationName,
//       receiptDate,
//       collectionCenter,
//       printDate,
//       username,
//       receipts: receipts.map((r, index) => ({
//         ...r,
//         srNo: index + 1
//       })),
//       totals: {
//         cashTotal: parseFloat(totals.cashTotal) || 0,
//         ddTotal: parseFloat(totals.ddTotal) || 0,
//         paidChequeTotal: parseFloat(totals.paidChequeTotal) || 0,
//         balanceChequeTotal: parseFloat(totals.balanceChequeTotal) || 0,
//         rebatesTotal: parseFloat(totals.rebatesTotal) || 0,
//         solarRebatesTotal: parseFloat(totals.solarRebatesTotal) || 0,
//         excessAmountTotal: parseFloat(totals.excessAmountTotal) || 0,
//         grandTotal: parseFloat(totals.grandTotal) || 0
//       },
//       userSummary: userSummary.map(user => ({
//         username: user.username || "-",
//         cash: parseFloat(user.cash) || 0,
//         dd: parseFloat(user.dd) || 0,
//         cheque: parseFloat(user.cheque) || 0,
//         livingCheque: parseFloat(user.livingCheque) || 0,
//         rebates: parseFloat(user.rebates) || 0,
//         solarRebates: parseFloat(user.solarRebates) || 0,
//         excessAmount: parseFloat(user.excessAmount) || 0,
//         totalCollection: parseFloat(user.totalCollection) || 0
//       }))
//     };

//     // Generate HTML
//     const html = template(reportData);

//     // Puppeteer launch options
//     const chromePath = path.resolve(
//       __dirname,
//       "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
//     );

//     const launchOptions = {
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     };

//     if (fs.existsSync(chromePath)) {
//       launchOptions.executablePath = chromePath;
//     }

//     // Launch browser and generate PDF
//     const browser = await puppeteer.launch(launchOptions);
//     const page = await browser.newPage();
    
//     await page.setContent(html, { 
//       waitUntil: "networkidle0", 
//       timeout: 30000 
//     });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       landscape: true,
//       printBackground: true,
//       margin: { 
//         top: "10mm", 
//         bottom: "10mm", 
//         left: "8mm", 
//         right: "8mm" 
//       },
//     });

//     await browser.close();

//     // Save PDF
//     const outputDir = path.resolve(__dirname, "../../../public/pdf");
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     const timestamp = Date.now();
//     const fileName = `Receipt_Details_Report_${timestamp}.pdf`;
//     const outputPath = path.join(outputDir, fileName);

//     // Optional: Merge or modify PDF with pdf-lib if needed
//     const finalPdf = await PDFDocument.load(pdfBuffer);
//     const finalBytes = await finalPdf.save();
//     fs.writeFileSync(outputPath, finalBytes);

//     return { 
//       fileName, 
//       outputPath,
//       pdfUrl: `/pdf/${fileName}`
//     };

//   } catch (error) {
//     console.error("Receipt Details Report PDF generation error:", error);
//     throw error;
//   }
// };

// module.exports = {
//   generateReceiptDetailsReportPDF,
// };

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");

/* ✅ Chunk helper - splits array into batches */
const chunkArray = (array = [], size = 1) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const imageToBase64 = (imgPath) => {
  try {
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return "";
  }
};

/**
 * Generate Receipt Details Report PDF
 * @param {Object} params
 * @param {Array} params.receipts - Receipt details for Table 1
 * @param {Object} params.totals - Grand total summary for Table 2
 * @param {Array} params.userSummary - User-wise summary for Table 3
 * @param {String} params.receiptDate - Date of receipts
 * @param {String} params.collectionCenter - Collection center name
 * @param {String} params.printDate - Print date
 * @param {String} params.corporationName - Corporation name
 * @param {String} params.username - Username who generated report
 * @param {Number} params.batchSize - Number of rows per page (default: 10)
 */
const generateReceiptDetailsReportPDF = async ({
  receipts = [],
  totals = {},
  userSummary = [],
  receiptDate = "",
  collectionCenter = "",
  printDate = "",
  corporationName = "Nashik Municipal Corporation",
  username = "User",
  batchSize = 10 // ✅ Batch size for rows per page
}) => {
  let browser;

  try {
    if (!receipts || receipts.length === 0) {
      throw new Error("No receipt data provided");
    }

    // Template path
    const templatePath = path.resolve(__dirname, "../../templates/receipt-details-report.html");
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    // Read and compile template
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    // Get logo
    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    // Register Handlebars helpers
    Handlebars.registerHelper('formatNumber', function(value) {
      if (value === undefined || value === null) return '0.00';
      const num = parseFloat(value);
      return isNaN(num) ? '0.00' : num.toFixed(2);
    });

    // Puppeteer launch options
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    browser = await puppeteer.launch(launchOptions);

    /* ==============================
        ✅ Create Final PDF Document
    ============================== */
    const finalPdf = await PDFDocument.create();

    // Split receipts into batches (chunks)
    const receiptChunks = chunkArray(receipts, batchSize);
    let pageNumber = 1;

    // Process each chunk (page)
    for (const chunk of receiptChunks) {
      // Prepare data for this page
      const pageData = {
        logo,
        corporationName,
        receiptDate,
        collectionCenter,
        printDate,
        username,
        pageNumber,
        totalPages: receiptChunks.length,
        receipts: chunk.map((r, index) => ({
          ...r,
          srNo: (pageNumber - 1) * batchSize + (index + 1) // ✅ Calculate correct Sr No across pages
        })),
        totals: {
          cashTotal: parseFloat(totals.cashTotal) || 0,
          ddTotal: parseFloat(totals.ddTotal) || 0,
          paidChequeTotal: parseFloat(totals.paidChequeTotal) || 0,
          balanceChequeTotal: parseFloat(totals.balanceChequeTotal) || 0,
          rebatesTotal: parseFloat(totals.rebatesTotal) || 0,
          solarRebatesTotal: parseFloat(totals.solarRebatesTotal) || 0,
          excessAmountTotal: parseFloat(totals.excessAmountTotal) || 0,
          grandTotal: parseFloat(totals.grandTotal) || 0
        },
        userSummary: userSummary.map(user => ({
          username: user.username || "-",
          cash: parseFloat(user.cash) || 0,
          dd: parseFloat(user.dd) || 0,
          cheque: parseFloat(user.cheque) || 0,
          livingCheque: parseFloat(user.livingCheque) || 0,
          rebates: parseFloat(user.rebates) || 0,
          solarRebates: parseFloat(user.solarRebates) || 0,
          excessAmount: parseFloat(user.excessAmount) || 0,
          totalCollection: parseFloat(user.totalCollection) || 0
        })),
        // ✅ Show totals only on last page
        showTotals: pageNumber === receiptChunks.length
      };

      // Generate HTML for this page
      const html = template(pageData);

      // Create new page in browser
      const page = await browser.newPage();
      await page.setContent(html, { 
        waitUntil: "networkidle0", 
        timeout: 30000 
      });

      // Generate PDF for this page
      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        margin: { 
          top: "10mm", 
          bottom: "10mm", 
          left: "8mm", 
          right: "8mm" 
        },
      });

      // Add this page to final PDF
      const tempPdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await finalPdf.copyPages(
        tempPdf,
        tempPdf.getPageIndices()
      );
      copiedPages.forEach((p) => finalPdf.addPage(p));

      await page.close();
      pageNumber++;
    }

    await browser.close();

    // Save PDF
    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `Receipt_Details_Report_${timestamp}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { 
      fileName, 
      outputPath,
      pdfUrl: `/pdf/${fileName}`
    };

  } catch (error) {
    console.error("Receipt Details Report PDF generation error:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  chunkArray,
  generateReceiptDetailsReportPDF,
};