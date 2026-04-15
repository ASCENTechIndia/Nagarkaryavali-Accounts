const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");
// const QRCode = require("qrcode"); // (not used in this file, keep only if you need)
                                    // If not used, better remove to avoid lint warnings

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
    if (!fs.existsSync(imgPath)) {
      console.warn(`⚠️ Image not found at: ${imgPath}`);
      return "";
    }
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return "";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0.00";
  const n = parseFloat(amount);
  if (isNaN(n)) return "0.00";
  return n.toFixed(2);
};

const calculatePageTotals = (chunk) => {
  const totals = {
    rcptAmount: 0,
    arrears: 0,
    s1: 0,
    s2: 0,
    currentTotal: 0,
    adminCharges: 0,
    extra: 0,
    rebate: 0,
    advance: 0,
    stampCount: 0,
  };

  chunk.forEach((item) => {
    totals.rcptAmount += parseFloat(item.totalAmount || 0);
    totals.arrears += parseFloat(item.arrears || 0);
    totals.s1 += parseFloat(item.s1Sum || 0);
    totals.s2 += parseFloat(item.s2Sum || 0);
    totals.currentTotal +=
      parseFloat(item.s1Sum || 0) + parseFloat(item.s2Sum || 0);
    totals.adminCharges += parseFloat(item.adminCharges || 0);
    totals.extra += parseFloat(item.extra || 0);
    totals.rebate += parseFloat(item.rebate || 0);
    totals.advance += parseFloat(item.advance || 0);

    if (item.stamp === "1" || item.stamp === "Y" || item.stamp === true) {
      totals.stampCount += 1;
    }
  });

  return {
    rcptAmount: formatCurrency(totals.rcptAmount),
    arrears: formatCurrency(totals.arrears),
    s1: formatCurrency(totals.s1),
    s2: formatCurrency(totals.s2),
    currentTotal: formatCurrency(totals.currentTotal),
    adminCharges: formatCurrency(totals.adminCharges),
    extra: formatCurrency(totals.extra),
    rebate: formatCurrency(totals.rebate),
    advance: formatCurrency(totals.advance),
    stampCount: String(totals.stampCount),
  };
};

const calculateOverallTotals = (reportData = []) => {
  const totals = {
    rcptAmount: 0,
    arrears: 0,
    s1: 0,
    s2: 0,
    currentTotal: 0,
    adminCharges: 0,
    extra: 0,
    rebate: 0,
    advance: 0,
    stampCount: 0,
  };

  reportData.forEach((item) => {
    totals.rcptAmount += parseFloat(item.totalAmount || 0);
    totals.arrears += parseFloat(item.arrears || 0);
    totals.s1 += parseFloat(item.s1Sum || 0);
    totals.s2 += parseFloat(item.s2Sum || 0);
    totals.currentTotal +=
      parseFloat(item.s1Sum || 0) + parseFloat(item.s2Sum || 0);
    totals.adminCharges += parseFloat(item.adminCharges || 0);
    totals.extra += parseFloat(item.extra || 0);
    totals.rebate += parseFloat(item.rebate || 0);
    totals.advance += parseFloat(item.advance || 0);

    if (item.stamp === "1" || item.stamp === "Y" || item.stamp === true) {
      totals.stampCount += 1;
    }
  });

  return {
    rcptAmount: formatCurrency(totals.rcptAmount),
    arrears: formatCurrency(totals.arrears),
    s1: formatCurrency(totals.s1),
    s2: formatCurrency(totals.s2),
    currentTotal: formatCurrency(totals.currentTotal),
    adminCharges: formatCurrency(totals.adminCharges),
    extra: formatCurrency(totals.extra),
    rebate: formatCurrency(totals.rebate),
    advance: formatCurrency(totals.advance),
    stampCount: String(totals.stampCount),
  };
};

const generateCollectionRegisterPDF = async ({
  reportData = [],
  filters = {},
  metaData = {},
  templateName = "collection-register-report.html",
}) => {
  try {
    if (!reportData || reportData.length === 0) {
      throw new Error("No records found for the selected criteria");
    }

    const templatePath = path.resolve(__dirname, `../../templates/${templateName}`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");

    // ✅ Register helper once (safe even if called multiple times)
    Handlebars.registerHelper("calculateTotal", function (s1, s2) {
      const s1Num = parseFloat(s1) || 0;
      const s2Num = parseFloat(s2) || 0;
      return (s1Num + s2Num).toFixed(2);
    });

    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

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

    const browser = await puppeteer.launch(launchOptions);
    const finalPdf = await PDFDocument.create();

    const BATCH_SIZE = 11;
    const chunks = chunkArray(reportData, BATCH_SIZE);

    let pageNumber = 1;
    const totalPages = chunks.length;

    // ✅ Initialize cumulative totals
    const cumulativeTotals = {
      rcptAmount: 0,
      arrears: 0,
      s1: 0,
      s2: 0,
      currentTotal: 0,
      adminCharges: 0,
      extra: 0,
      rebate: 0,
      advance: 0,
      stampCount: 0,
    };

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const isLastPage = index === chunks.length - 1;

      // ✅ Calculate page totals for current chunk
      const pageTotals = calculatePageTotals(chunk);
      
      // ✅ Add page totals to cumulative totals
      cumulativeTotals.rcptAmount += parseFloat(pageTotals.rcptAmount || 0);
      cumulativeTotals.arrears += parseFloat(pageTotals.arrears || 0);
      cumulativeTotals.s1 += parseFloat(pageTotals.s1 || 0);
      cumulativeTotals.s2 += parseFloat(pageTotals.s2 || 0);
      cumulativeTotals.currentTotal += parseFloat(pageTotals.currentTotal || 0);
      cumulativeTotals.adminCharges += parseFloat(pageTotals.adminCharges || 0);
      cumulativeTotals.extra += parseFloat(pageTotals.extra || 0);
      cumulativeTotals.rebate += parseFloat(pageTotals.rebate || 0);
      cumulativeTotals.advance += parseFloat(pageTotals.advance || 0);
      cumulativeTotals.stampCount += parseInt(pageTotals.stampCount || 0);

      const batchData = {
        corporationName: metaData.corporationName || "Municipal Corporation",
        reportTitle:
          "PROPERTY TAX DEPARTMENT - COLLECTION REGISTER (BHARNA REGISTER)",

        // Filter Criteria
        fromDate: filters.fromDate || "",
        toDate: filters.toDate || "",
        prabhagName: metaData.prabhagName || "ALL",
        zoneName: metaData.zoneName || "ALL",
        sectorName: metaData.sectorName || "ALL",
        modeName: metaData.modeName || "ALL",

        // Pagination
        pageNumber,
        totalPages,
        isLastPage,

        logo,

        receipts: chunk.map((r, i) => {
          const globalIndex = (pageNumber - 1) * BATCH_SIZE + (i + 1);
          return {
            srNo: globalIndex,
            receiptNo: r.receiptNo || "-",
            receiptDate: formatDate(r.receiptDate),
            ownerName: r.ownerName || "-",
            houseNo: r.houseNo || "-",
            propertyNo: r.propertyNo || "-",
            zone: r.zone || "-",
            sector: r.sector || "-",
            payMode: r.payMode || "-",
            chequeNo: r.chequeNo || "-",
            chequeDate: formatDate(r.chequeDate),
            bankName: r.bankName || "-",
            totalAmount: formatCurrency(r.totalAmount),
            arrears: formatCurrency(r.arrears),
            s1Sum: formatCurrency(r.s1Sum),
            s2Sum: formatCurrency(r.s2Sum),
            adminCharges: formatCurrency(r.adminCharges),
            extra: formatCurrency(r.extra),
            rebate: formatCurrency(r.rebate),
            advance: formatCurrency(r.advance),
            stamp: r.stamp || "",
          };
        }),

        // ✅ For last page, show cumulative totals instead of just page totals
        pageTotal: isLastPage ? {
          rcptAmount: formatCurrency(cumulativeTotals.rcptAmount),
          arrears: formatCurrency(cumulativeTotals.arrears),
          s1: formatCurrency(cumulativeTotals.s1),
          s2: formatCurrency(cumulativeTotals.s2),
          currentTotal: formatCurrency(cumulativeTotals.currentTotal),
          adminCharges: formatCurrency(cumulativeTotals.adminCharges),
          extra: formatCurrency(cumulativeTotals.extra),
          rebate: formatCurrency(cumulativeTotals.rebate),
          advance: formatCurrency(cumulativeTotals.advance),
          stampCount: String(cumulativeTotals.stampCount),
        } : null,

        // ✅ Overall Summary (if needed separately)
        summary: isLastPage ? {
          totalRecords: reportData.length,
          totalReceiptAmount: formatCurrency(cumulativeTotals.rcptAmount),
          totalArrears: formatCurrency(cumulativeTotals.arrears),
          totalS1: formatCurrency(cumulativeTotals.s1),
          totalS2: formatCurrency(cumulativeTotals.s2),
          totalCurrentTotal: formatCurrency(cumulativeTotals.currentTotal),
          totalAdminCharges: formatCurrency(cumulativeTotals.adminCharges),
          totalExtra: formatCurrency(cumulativeTotals.extra),
          totalRebate: formatCurrency(cumulativeTotals.rebate),
          totalAdvance: formatCurrency(cumulativeTotals.advance),
          stampCount: cumulativeTotals.stampCount,
        } : null,
      };

      const html = template(batchData);

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        margin: {
          top: "10mm",
          bottom: "15mm",
          left: "10mm",
          right: "10mm",
        },
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

    // ✅ Save PDF File
    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `CollectionRegister_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return {
      success: true,
      fileName,
      outputPath,
      downloadUrl: `/pdf/${fileName}`,
      summary: {
        totalRecords: reportData.length,
        totalReceiptAmount: formatCurrency(cumulativeTotals.rcptAmount),
        totalArrears: formatCurrency(cumulativeTotals.arrears),
        totalS1: formatCurrency(cumulativeTotals.s1),
        totalS2: formatCurrency(cumulativeTotals.s2),
        totalCurrentTotal: formatCurrency(cumulativeTotals.currentTotal),
        totalAdminCharges: formatCurrency(cumulativeTotals.adminCharges),
        totalExtra: formatCurrency(cumulativeTotals.extra),
        totalRebate: formatCurrency(cumulativeTotals.rebate),
        totalAdvance: formatCurrency(cumulativeTotals.advance),
        stampCount: cumulativeTotals.stampCount,
        totalPages,
      },
    };
  } catch (error) {
    console.error("❌ Collection Register PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  chunkArray,
  imageToBase64,
  formatDate,
  formatCurrency,
  generateCollectionRegisterPDF,
  
};
