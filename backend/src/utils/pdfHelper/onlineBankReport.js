const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer"); // ✅ puppeteer (not puppeteer-core)
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
  if (!fs.existsSync(imgPath)) {
    console.warn("Logo file not found:", imgPath);
    return "";
  }
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

/* ✅ Calculate totals from API data */
const calculateTotals = (reportData = []) => {
  const totals = {
    arrearse: 0,
    current: 0,
    advancePayment: 0,
    rebate: 0,
    solarRebate: 0,
    arrearsShasti: 0,
    currentShasti: 0,
    bounceAmount: 0,
    total: 0
  };

  reportData.forEach(item => {
    totals.arrearse += parseFloat(item.ArrearsCollection || item.arrears_collection || 0);
    totals.current += parseFloat(item.CurrentCollection || item.current_collection || 0);
    totals.advancePayment += parseFloat(item.AdvanceAmount || item.advance_amount || 0);
    totals.rebate += parseFloat(item.Rebate || item.rebate || 0);
    totals.solarRebate += parseFloat(item.SolarDiscount || item.solar_discount || 0);
    totals.arrearsShasti += parseFloat(item.ArrearsIllegalCollection || item.arrears_illegal_collection || 0);
    totals.currentShasti += parseFloat(item.CurrentIllegalCollection || item.current_illegal_collection || 0);
    
    const arrearsBounce = parseFloat(item.ArrearsChequeBounce || item.arrears_cheque_bounce || 0);
    const currentBounce = parseFloat(item.CurrentChequeBounce || item.current_cheque_bounce || 0);
    totals.bounceAmount += arrearsBounce + currentBounce;
    
    totals.total += parseFloat(item.TotalAmount || item.total_amount || 0);
  });

  return totals;
};

/* ✅ Format numbers */
const formatNumber = (num) => {
  return parseFloat(num || 0).toFixed(2);
};

/* ✅ Format numbers with Indian formatting for display */
const formatIndianNumber = (num) => {
  const number = parseFloat(num || 0);
  return number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/* ✅ Get zone name from data or use default */
const getZoneName = (data, zoneId) => {
  if (data.length > 0 && data[0].ZoneName) {
    return data[0].ZoneName;
  }
  if (data.length > 0 && data[0].zonename) {
    return data[0].zonename;
  }
  return `Zone ${zoneId}`;
};

/* ✅ Get bank name from data or use default */
const getBankName = (data, bankId) => {
  if (data.length > 0 && data[0].bank_name) {
    return data[0].bank_name;
  }
  if (data.length > 0 && data[0].BankName) {
    return data[0].BankName;
  }
  return `Bank ${bankId || "All"}`;
};

/* ✅ Generate Online Bank Report PDF */
const generateOnlineBankReportPDF = async ({
  reportData = [],
  corporationName = "Nashik Municipal Corporation",
  asOnDate = "",
  zoneName = "",
  branchName = "",
  generatedBy = "",
}) => {
  try {
    if (!reportData || reportData.length === 0) {
      throw new Error("No report data found for the selected criteria");
    }

    /* ==============================
        ✅ Template Path
    ============================== */
    const templatePath = path.resolve(
      __dirname,
      "../../templates/online-bank-report.html"
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
        ✅ Calculate totals
    ============================== */
    const totals = calculateTotals(reportData);

    /* ==============================
        ✅ Detect Installed Chrome (Windows)
    ============================== */
     const chromePath = path.resolve(
        __dirname,
        "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
      );

    const launchOptions = {
      headless: true,executablePath:chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    const browser = await puppeteer.launch(launchOptions);

    /* ==============================
        ✅ Final PDF Merge Document
    ============================== */
    const finalPdf = await PDFDocument.create();

    const BATCH_SIZE = 13;
    const chunks = chunkArray(reportData, BATCH_SIZE);

    let pageNumber = 1;

    for (const chunk of chunks) {
      // Format chunk data for display
      const formattedChunk = chunk.map((item, index) => ({
        srNo: (pageNumber - 1) * BATCH_SIZE + (index + 1),
        zoneName: item.ZoneName || item.zonename || "N/A",
        arrearse: formatIndianNumber(item.ArrearsCollection || item.arrears_collection || 0),
        current: formatIndianNumber(item.CurrentCollection || item.current_collection || 0),
        advancePayment: formatIndianNumber(item.AdvanceAmount || item.advance_amount || 0),
        rebate: formatIndianNumber(item.Rebate || item.rebate || 0),
        solarRebate: formatIndianNumber(item.SolarDiscount || item.solar_discount || 0),
        arrearsShasti: formatIndianNumber(item.ArrearsIllegalCollection || item.arrears_illegal_collection || 0),
        currentShasti: formatIndianNumber(item.CurrentIllegalCollection || item.current_illegal_collection || 0),
        bounceAmount: formatIndianNumber(
          (parseFloat(item.ArrearsChequeBounce || item.arrears_cheque_bounce || 0) + 
           parseFloat(item.CurrentChequeBounce || item.current_cheque_bounce || 0))
        ),
        total: formatIndianNumber(item.TotalAmount || item.total_amount || 0)
      }));

      const isLastPage = pageNumber === chunks.length;

      const batchData = {
        corporationName,
        asOnDate: asOnDate || new Date().toLocaleDateString('en-IN'),
        zoneName: zoneName || "All Zones",
        branchName: branchName || "All Branches",
        generatedBy: generatedBy || "System",
        generatedDate: new Date().toLocaleString('en-IN'),

        logo,

        pageNumber,
        totalPages: chunks.length,
        
        reportData: formattedChunk,

        // Show totals only on last page
        totals: isLastPage ? {
          arrearse: formatIndianNumber(totals.arrearse),
          current: formatIndianNumber(totals.current),
          advancePayment: formatIndianNumber(totals.advancePayment),
          rebate: formatIndianNumber(totals.rebate),
          solarRebate: formatIndianNumber(totals.solarRebate),
          arrearsShasti: formatIndianNumber(totals.arrearsShasti),
          currentShasti: formatIndianNumber(totals.currentShasti),
          bounceAmount: formatIndianNumber(totals.bounceAmount),
          total: formatIndianNumber(totals.total)
        } : null,

        showFooter: isLastPage,
        totalRecords: reportData.length,
        currentBatchEnd: Math.min(pageNumber * BATCH_SIZE, reportData.length)
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

    const timestamp = Date.now();
    const fileName = `OnlineBankReport_${timestamp}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { 
      success: true,
      fileName, 
      outputPath,
      fileSize: finalBytes.length,
      totalPages: chunks.length,
      totalRecords: reportData.length
    };
  } catch (error) {
    console.error("❌ Online Bank Report PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  generateOnlineBankReportPDF,
  getZoneName,
  getBankName
};