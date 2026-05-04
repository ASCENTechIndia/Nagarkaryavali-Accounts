// utils/pdfHelper/CounterVoucherPDFHelper.js

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// =======================
// FORMAT HELPERS
// =======================
const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB") : "-";

const formatNumber = (num) =>
  Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// =======================
// MAIN FUNCTION
// =======================
const CounterVoucherPDFHelper = async ({
  header = {},
  details = [],
  corporationName = "",
  corporationLogo = "",
}) => {
  let browser;
  let page;

  try {
    // ✅ Safe handling (no crash)
    const safeDetails = details || [];

    // =======================
    // PREPARE DATA FOR TEMPLATE
    // =======================
    let totalAmount = 0;

    const rows = safeDetails.map((d, index) => {
      const amt = Number(d.AMOUNT || 0);
      totalAmount += amt;

      return {
        sr: index + 1,
        glcode: d.GLCODE || "-",
        accno: d.ACCNO || "-",
        accname: d.ACCNAME || "-",
        amount: formatNumber(amt),
      };
    });

    // ✅ Add total row
    rows.push({
      isTotal: true,
      label: "Total",
      amount: formatNumber(totalAmount),
    });

    const data = {
      corporationName,
      corporationLogo,

      refno: header.REFNO || "-",
      partyname: header.PARTYNAME || "-",
      deptname: header.DEPTNAME || "-",
      narration: header.NARRATION || "-",
      transdate: formatDate(header.TRANSDATE),
      grossamount: formatNumber(header.GROSSAMOUNT),

      rows,
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
    // LAUNCH BROWSER
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

    // =======================
    // SAVE FILE
    // =======================
    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf"
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