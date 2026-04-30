const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// =======================
// FORMAT HELPERS
// =======================
const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB") : "";

const formatNumber = (num) =>
  Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// =======================
// MAIN HELPER
// =======================
const CounterVoucherPDFHelper = async ({
  reportData,
   corporationName = "",
  corporationLogo = "",
}) => {
  let browser;
  let page;

  try {
    if (!reportData || !reportData.length) {
      throw new Error("No data found for PDF");
    }

    const row = reportData[0];

    // =======================
    // DATA MAPPING
    // =======================
const now = new Date();

const data = {
  corporationName,
  corporationLogo,

  voucherDate: formatDate(row.VOUCHERDATE),
  voucherNo: row.VOUCHERNO || "",
  chequeNo: row.CHQNO || "0",

  currentDate: formatDate(now),
  currentTime: now.toLocaleTimeString(),

   rows: reportData.map((r) => ({
    drCode: r.DRACCOUNTCODE,
    drParticular: r.DRPARTICULARS,
    drAmount: formatNumber(r.DRAMOUNT),

    crCode: r.CRACCOUNTCODE,
    crParticular: r.CRPARTICULARS,
    crAmount: formatNumber(r.CRAMOUNT),
  })),
};

    // =======================
    // LOAD TEMPLATE
    // =======================
    const templatePath = path.resolve(
      __dirname,
      "../../templates/CounterVoucher.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const html = template(data);

    // =======================
    // BROWSER SETUP
    // =======================
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
    page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // =======================
    // GENERATE PDF
    // =======================
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

   
    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf" // ✅ IMPORTANT PATH
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `CounterVoucher_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return {
      fileName,
      filePath,
    };

  } catch (err) {
    console.error("Counter Voucher PDF Error:", err);
    throw err;
  } finally {
    // =======================
    // CLEANUP
    // =======================
    if (page) {
      try { await page.close(); } catch {}
    }
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
};

module.exports = {
  CounterVoucherPDFHelper,
};