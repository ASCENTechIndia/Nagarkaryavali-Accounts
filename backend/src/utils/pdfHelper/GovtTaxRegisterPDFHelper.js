const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// =======================
// FORMAT HELPERS
// =======================
const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  return dt.toLocaleDateString("en-GB");
};

const formatNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getValueOrAll = (val) => {
  if (val === undefined || val === null || val === "" || val === "-1") {
    return "All";
  }
  return val;
};

// =======================
// MAIN HELPER
// =======================
const GovtTaxRegisterPDFHelper = async ({
  reportData,
  filters,
  corporationName,
  corporationLogo,
}) => {
  try {
    if (!reportData || !reportData.length) {
      throw new Error("No data found for PDF");
    }

    // =======================
    // FILTER HANDLING (DYNAMIC)
    // =======================
    const filterData = {
      deductionHead:
        filters.majorName || getValueOrAll(filters.majorCode),

      bank:
        filters.bankName ||
        (filters.bankAcc
          ? `${filters.bankGl || ""}-${filters.bankAcc}`
          : "All"),

      vendor:
        filters.partyName || getValueOrAll(filters.partyId),

      fromDate: formatDate(filters.fromDate),
      toDate: formatDate(filters.toDate),
    };

    // =======================
    // DATA MAPPING (AS PER YOUR RULES)
    // =======================
    let totalGross = 0;
    let totalNet = 0;
    let totalTax = 0;

    const data = reportData.map((row, index) => {
      const gross = Number(row.PREGROSSAMT || 0);   // Gross Bill
      const net = Number(row.PRENETAMT || 0);       // Net Bill
      const tax = Number(row.TAXAMT || 0);          // Deduction
      const paid = Number(row.GROSSBILLAMT || 0);   // Actual Paid
      const balance = Number(row.NETAMT || 0);      // Balance

      totalGross += gross;
      totalNet += net;
      totalTax += tax;

      return {
        srNo: index + 1,
        party: row.PARTYNAME || "",

        gross: formatNumber(gross),
        net: formatNumber(net),
        tax: formatNumber(tax),
        paid: formatNumber(paid),
        balance: formatNumber(balance),

        voucher1: row.VOUCHERNO || "",
        voucher2: row.TRANSNO || "",
        date: formatDate(row.TRANSDT),

        challan: row.CHALLANNO || "",
        tds: row.TDSCERT || "",
      };
    });

    // =======================
    // TEMPLATE LOAD
    // =======================
    const templatePath = path.resolve(
      __dirname,
      "../../templates/GovtTaxRegister.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const html = template({
      corporationName,
      corporationLogo,

      filters: filterData,

      currentDate: formatDate(new Date()),
      currentTime: new Date().toLocaleTimeString(),

      data,
      totalGross: formatNumber(totalGross),
      totalNet: formatNumber(totalNet),
      totalTax: formatNumber(totalTax),
    });

    // =======================
    // BROWSER SETUP
    // =======================
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-*/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    // =======================
    // PDF GENERATION
    // =======================
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      displayHeaderFooter: true,

      headerTemplate: `<div></div>`,

      footerTemplate: `
        <div style="font-size:10px;width:100%;text-align:right;padding-right:20px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,

      margin: {
        top: "60px",
        bottom: "40px",
        left: "20px",
        right: "20px",
      },
    });

    await page.close();
    await browser.close();

    // =======================
    // SAVE FILE
    // =======================
    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `GovtTaxRegister_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return {
      fileName,
      filePath,
    };

  } catch (error) {
    console.error("GovtTaxRegister PDF Error:", error);
    throw error;
  }
};

module.exports = {
  GovtTaxRegisterPDFHelper,
};