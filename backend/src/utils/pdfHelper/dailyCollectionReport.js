const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer"); // ✅ puppeteer (not puppeteer-core)
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");
const QRCode = require("qrcode");

/* ✅ Chunk helper */
const chunkArray = (array = [], size = 1) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/* ✅ Convert image to base64 */
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

/* ✅ Generate Daily Collection PDF */
const generateDailyCollectionPDF = async ({
  receipts = [],
  corporationName = "Nashik Municipal Corporation",
  fromDate = "",
  toDate = "",
  collectionCenter = "",
  userName = "",
  bankName = "",
}) => {

  let browser;

  try {
    if (!receipts || receipts.length === 0) {
      throw new Error("No records found for the selected criteria");
    }

    /* ==============================
        ✅ Template Path
    ============================== */
    const templatePath = path.resolve(
      __dirname,
      "../../templates/daily-collection-report.html"
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
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    /* ==============================
        ✅ QR CODE Base64
    ============================== */
    const qrCode = await QRCode.toDataURL(
      `DailyReport|${collectionCenter}|${fromDate}|${toDate}`
    );

    /* ==============================
        ✅ Detect Installed Chrome (Windows)
    ============================== */
    const chromePath = path.resolve(
         __dirname,
         "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
       );

    const launchOptions = {
      headless: true, executablePath:chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    browser = await puppeteer.launch(launchOptions);

    /* ==============================
        ✅ Final PDF Merge Document
    ============================== */
    const finalPdf = await PDFDocument.create();

    const BATCH_SIZE = 8;
    const chunks = chunkArray(receipts, BATCH_SIZE);

    let pageNumber = 1;

    for (const chunk of chunks) {
      const totalAmount = chunk.reduce(
        (sum, item) => sum + Number(item?.amount || 0),
        0
      );

      const batchData = {
        corporationName,
        fromDate,
        toDate,
        collectionCenter,
        userName,
        bankName, // ✅ keep passed value

        currentDate: new Date().toLocaleDateString("en-GB"),
        accountNo: "0",
        codeNo: "0",
        pageNumber,

        logo,
        qrCode,

        receipts: chunk.map((r, i) => ({
          srNo: (pageNumber - 1) * BATCH_SIZE + (i + 1),
          propertyNo: r?.propertyNo || "-",
          ownerName: r?.ownerName || "-",
          chequeNo: r?.chequeNo || "-",
          chequeDate: r?.chequeDate || "-",
          bank: r?.bank || "-",
          receiptNo: r?.receiptNo || "-",
          receiptDate: r?.receiptDate || "-",
          amount: (r?.amount || "0").toString(),
          stamp: r?.stamp || "1",
          remark: r?.remark || "",
        })),

        totalReceipts: chunk.length,
        totalAmount: totalAmount.toLocaleString("en-IN"),
      };

      const html = template(batchData);

      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: "domcontentloaded",
        timeout: 0,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
      });

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

    /* ==============================
        ✅ Save PDF File
    ============================== */
    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `DailyCollection_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { fileName, outputPath };
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    throw error;
  }
  finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  chunkArray,
  imageToBase64,
  generateDailyCollectionPDF,
};


// const fs = require("fs");
// const path = require("path");
// const puppeteer = require("puppeteer");
// const Handlebars = require("handlebars");
// const { PDFDocument } = require("pdf-lib");
// const QRCode = require("qrcode");
// const os = require("os");

// /* ✅ Chunk helper */
// const chunkArray = (array = [], size = 1) => {
//   const chunks = [];
//   for (let i = 0; i < array.length; i += size) {
//     chunks.push(array.slice(i, i + size));
//   }
//   return chunks;
// };

// /* ✅ Convert image to base64 */
// const imageToBase64 = (imgPath) => {
//   const file = fs.readFileSync(imgPath);
//   const ext = path.extname(imgPath).replace(".", "");
//   return `data:image/${ext};base64,${file.toString("base64")}`;
// };

// /* ✅ Generate Daily Collection PDF */
// const generateDailyCollectionPDF = async ({
//   receipts = [],
//   corporationName = "Nashik Municipal Corporation",
//   fromDate = "",
//   toDate = "",
//   collectionCenter = "",
//   userName = "",
//   bankName = "",
// }) => {
//   let browser;
//   let userDataDir = null;

//   try {
//     if (!receipts || receipts.length === 0) {
//       throw new Error("No records found for the selected criteria");
//     }

//     /* ==============================
//         ✅ Template Path
//     ============================== */
//     const templatePath = path.resolve(
//       __dirname,
//       "../../templates/daily-collection-report.html"
//     );

//     if (!fs.existsSync(templatePath)) {
//       throw new Error(`Template not found at: ${templatePath}`);
//     }

//     const templateHtml = fs.readFileSync(templatePath, "utf8");
//     const template = Handlebars.compile(templateHtml);

//     /* ==============================
//         ✅ Logo Base64
//     ============================== */
//     const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
//     const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

//     /* ==============================
//         ✅ QR CODE Base64
//     ============================== */
//     const qrCode = await QRCode.toDataURL(
//       `DailyReport|${collectionCenter}|${fromDate}|${toDate}`
//     );

//     /* ==============================
//         ✅ Create Unique User Data Directory
//     ============================== */
//     userDataDir = path.join(os.tmpdir(), `puppeteer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
//     /* ==============================
//         ✅ Detect Installed Chrome (Windows) or use chromium from puppeteer
//     ============================== */
//     let launchOptions = {
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//         "--disable-accelerated-2d-canvas",
//         "--no-first-run",
//         "--no-zygote",
//         "--single-process",
//         "--disable-setuid-sandbox"
//       ],
//       userDataDir: userDataDir
//     };

//     // Try to find Chrome on server, otherwise use puppeteer's bundled Chromium
//     const possibleChromePaths = [
//       "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//       "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
//       "/usr/bin/google-chrome",
//       "/usr/bin/chromium",
//       "/usr/bin/chromium-browser"
//     ];

//     for (const chromePath of possibleChromePaths) {
//       if (fs.existsSync(chromePath)) {
//         launchOptions.executablePath = chromePath;
//         break;
//       }
//     }

//     // On Linux server, you might need to install chromium separately
//     if (process.platform === 'linux' && !launchOptions.executablePath) {
//       launchOptions.args.push('--disable-dev-shm-usage');
//     }

//     browser = await puppeteer.launch(launchOptions);

//     /* ==============================
//         ✅ Final PDF Merge Document
//     ============================== */
//     const finalPdf = await PDFDocument.create();

//     const BATCH_SIZE = 12;
//     const chunks = chunkArray(receipts, BATCH_SIZE);

//     let pageNumber = 1;

//     for (const chunk of chunks) {
//       const totalAmount = chunk.reduce(
//         (sum, item) => sum + Number(item?.amount || 0),
//         0
//       );

//       const batchData = {
//         corporationName,
//         fromDate,
//         toDate,
//         collectionCenter,
//         userName,
//         bankName, // ✅ keep passed value

//         currentDate: new Date().toLocaleDateString("en-GB"),
//         accountNo: "0",
//         codeNo: "0",
//         pageNumber,

//         logo,
//         qrCode,

//         receipts: chunk.map((r, i) => ({
//           srNo: (pageNumber - 1) * BATCH_SIZE + (i + 1),
//           propertyNo: r?.propertyNo || "-",
//           ownerName: r?.ownerName || "-",
//           chequeNo: r?.chequeNo || "-",
//           chequeDate: r?.chequeDate || "-",
//           bank: r?.bank || "-",
//           receiptNo: r?.receiptNo || "-",
//           receiptDate: r?.receiptDate || "-",
//           amount: (r?.amount || "0").toString(),
//           stamp: r?.stamp || "1",
//           remark: r?.remark || "",
//         })),

//         totalReceipts: chunk.length,
//         totalAmount: totalAmount.toLocaleString("en-IN"),
//       };

//       const html = template(batchData);

//       const page = await browser.newPage();
//       await page.setContent(html, {
//         waitUntil: "domcontentloaded",
//         timeout: 30000, // 30 seconds timeout
//       });

//       const pdfBuffer = await page.pdf({
//         format: "A4",
//         landscape: true,
//         printBackground: true,
//         margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
//         timeout: 60000 // 60 seconds timeout for PDF generation
//       });

//       const tempPdf = await PDFDocument.load(pdfBuffer);
//       const copiedPages = await finalPdf.copyPages(
//         tempPdf,
//         tempPdf.getPageIndices()
//       );
//       copiedPages.forEach((p) => finalPdf.addPage(p));

//       await page.close();
//       pageNumber++;
//     }

//     await browser.close();
//     browser = null;

//     /* ==============================
//         ✅ Save PDF File
//     ============================== */
//     const outputDir = path.resolve(__dirname, "../../../public/pdf");
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     const fileName = `DailyCollection_${Date.now()}.pdf`;
//     const outputPath = path.join(outputDir, fileName);

//     const finalBytes = await finalPdf.save();
//     fs.writeFileSync(outputPath, finalBytes);

//     return { fileName, outputPath };
//   } catch (error) {
//     console.error("❌ PDF generation error:", error);
//     throw error;
//   } finally {
//     // Always try to close browser
//     if (browser) {
//       try {
//         await browser.close();
//       } catch (closeError) {
//         console.error("Error closing browser:", closeError);
//       }
//     }
    
//     // Clean up user data directory
//     if (userDataDir && fs.existsSync(userDataDir)) {
//       try {
//         // Remove directory recursively
//         fs.rmSync(userDataDir, { recursive: true, force: true });
//       } catch (cleanupError) {
//         console.error("Error cleaning up user data directory:", cleanupError);
//       }
//     }
//   }
// };

// module.exports = {
//   chunkArray,
//   imageToBase64,
//   generateDailyCollectionPDF,
// };

