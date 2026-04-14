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


const generateAdminDailyCollectionPDF = async ({
  receipts = [],
  corporationName = "Nashik Municipal Corporation",
  fromDate = "",
  toDate = "",
  collectionCenter = "",
  userName = "",
  paymodeName = "All",
  grandTotal = 0,
  cashTotal = 0,
  chequeTotal = 0,
  stampTotal = 0,
  cashCount = 0,
  chequeCount = 0,
  stampCount = 0,
  totalCount = 0,
  currentLoginUser = ""
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
      "../../templates/admin-daily-collection-report.html"
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
        ✅ Chrome Path
    ============================== */
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      executablePath: chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (!fs.existsSync(chromePath)) {
      delete launchOptions.executablePath;
    }

    browser = await puppeteer.launch(launchOptions);

    /* ==============================
        ✅ Final PDF Merge Document
    ============================== */
    const finalPdf = await PDFDocument.create();

    const BATCH_SIZE = 10; // Adjust based on your layout
    const chunks = chunkArray(receipts, BATCH_SIZE);
    const totalPages = chunks.length;

    let pageNumber = 1;
    const allPageTotals = [];

    // Calculate totals for summary
    const totalReceiptsCount = receipts.length;
    const totalChequeReceiptsCount = chequeCount;
    const totalCashReceiptsCount = cashCount;
    const totalStampCount = stampCount;
    const totalChequeCount = chequeCount; // Same as cheque receipts count
    const totalStampAmount = stampTotal;

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
        collectionCenter,
        userName,
        currentLoginUser,
        paymodeName,
        currentDate: new Date().toLocaleDateString("en-GB"),
        pageNumber,
        totalPages,
        isLastPage,
        grandTotal: parseFloat(grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        pageTotal: pageTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 }),

        totalReceiptsCount: isLastPage ? totalReceiptsCount.toString() : "",
        totalChequeReceiptsCount: isLastPage ? totalChequeReceiptsCount.toString() : "",
        totalCashReceiptsCount: isLastPage ? totalCashReceiptsCount.toString() : "",
        totalStampCount: isLastPage ? totalStampCount.toString() : "",
        totalChequeCount: isLastPage ? totalChequeCount.toString() : "",
        totalStampAmount: isLastPage ? totalStampAmount.toString() : "",
        totalChequeAmount: isLastPage ? parseFloat(chequeTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "",
        totalCashAmount: isLastPage ? parseFloat(cashTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "",
        logo,
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
          amountFormatted: parseFloat(r?.amount || 0).toLocaleString("en-IN", { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          }), // ✅ Added amountFormatted
          stamp: r?.stamp || "",
          remark: r?.remark || "",
          wardNo: r?.wardNo || "-",
          username: r?.username || "-",
          cmscode: r?.cmscode || "-",
          cmsaccno: r?.cmsaccno || "-"
        })),
        totalReceipts: chunk.length,
      };

      console.log("Batch Data: ", batchData);

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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  chunkArray,
  imageToBase64,
  generateAdminDailyCollectionPDF,
};
