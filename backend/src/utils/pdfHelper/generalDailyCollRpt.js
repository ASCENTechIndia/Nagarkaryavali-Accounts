const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");

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
  try {
    if (fs.existsSync(imgPath)) {
      const file = fs.readFileSync(imgPath);
      const ext = path.extname(imgPath).replace(".", "");
      return `data:image/${ext};base64,${file.toString("base64")}`;
    }
    return "";
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return "";
  }
};

const generateMiraBhayandarDailyCollectionPDF = async ({
  receipts = [],
  corporationName = "मिरा भाईदर महानगरपालिका",
  fromDate = "",
  toDate = "",
  userName = "",
  paymodeName = "All",
  grandTotal = 0,
  cashTotal = 0,
  chequeTotal = 0,
  stampTotal = 0,
  cashCount = 0,
  chequeCount = 0,
  stampCount = 0,
  currentLoginUser = "",
  bankName = "",
  accountNo = "",
  codeNo = ""
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
      "../templates/mira-bhayandar-daily-collection.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    /* ==============================
        ✅ Logo Base64 (Optional)
    ============================== */
    const logoPath = path.resolve(__dirname, "../../assets/mira-bhayandar-logo.png");
    const logo = imageToBase64(logoPath);

    /* ==============================
        ✅ Chrome Path Configuration
    ============================== */
    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    };

    // Try to find Chrome executable
    const possiblePaths = [
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        launchOptions.executablePath = chromePath;
        break;
      }
    }

    browser = await puppeteer.launch(launchOptions);

    /* ==============================
        ✅ Final PDF Merge Document
    ============================== */
    const finalPdf = await PDFDocument.create();

    // Adjust BATCH_SIZE based on your layout (25-30 rows per page)
    const BATCH_SIZE = 25;
    const chunks = chunkArray(receipts, BATCH_SIZE);
    const totalPages = chunks.length;

    let pageNumber = 1;
    const allPageTotals = [];

    // Calculate totals for summary
    const totalReceiptsCount = receipts.length;
    const cashReceiptsCount = cashCount;
    const chequeReceiptsCount = chequeCount;

    for (const chunk of chunks) {
      // Calculate page total
      const pageTotal = chunk.reduce(
        (sum, item) => sum + Number(item?.amount || 0),
        0
      );
      allPageTotals.push(pageTotal);

      const isLastPage = pageNumber === totalPages;

      const batchData = {
        corporationName,
        fromDate,
        toDate,
        userName,
        currentLoginUser,
        paymodeName,
        bankName: bankName || (receipts[0]?.bank || "-"),
        accountNo: accountNo || (receipts[0]?.cmsaccno || "-"),
        codeNo: codeNo || (receipts[0]?.cmscode || "-"),
        currentDate: new Date().toLocaleDateString("en-GB"),
        pageNumber,
        totalPages,
        isLastPage,
        grandTotal: parseFloat(grandTotal).toLocaleString("en-IN", { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }),
        pageTotal: pageTotal.toLocaleString("en-IN", { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }),
        cashTotal: parseFloat(cashTotal).toLocaleString("en-IN", { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }),
        chequeTotal: parseFloat(chequeTotal).toLocaleString("en-IN", { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }),
        stampTotal: parseFloat(stampTotal).toLocaleString("en-IN", { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }),
        totalReceiptsCount: isLastPage ? totalReceiptsCount.toString() : "",
        cashReceiptsCount: isLastPage ? cashReceiptsCount.toString() : "",
        chequeReceiptsCount: isLastPage ? chequeReceiptsCount.toString() : "",
        stampCount: isLastPage ? stampCount.toString() : "",
        logo,
        receipts: chunk.map((r, i) => ({
          srNo: (pageNumber - 1) * BATCH_SIZE + (i + 1),
          applicationNo: r?.applicationNo || "-",
          propertyNo: r?.propertyNo || "-",
          instrumentNo: r?.instrumentNo || "-",
          instrumentDate: r?.instrumentDate || "-",
          bank: r?.bank || "-",
          ownerName: r?.ownerName || "-",
          serviceName: r?.serviceName || "-",
          paymentType: r?.paymentType || "-",
          receiptNo: r?.receiptNo || "-",
          amount: (r?.amount || "0").toString(),
          amountFormatted: parseFloat(r?.amount || 0).toLocaleString("en-IN", { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          }),
          stamp: r?.stamp || "0",
        })),
        totalReceipts: chunk.length,
      };

      const html = template(batchData);

      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: "networkidle0",
        timeout: 30000,
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

    const fileName = `MiraBhayandar_DailyCollection_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { 
      success: true, 
      fileName, 
      outputPath,
      totalPages,
      totalReceipts: receipts.length,
      grandTotal: parseFloat(grandTotal).toFixed(2)
    };
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error("Error closing browser:", e);
      }
    }
  }
};

module.exports = {
  chunkArray,
  imageToBase64,
  generateMiraBhayandarDailyCollectionPDF,
};