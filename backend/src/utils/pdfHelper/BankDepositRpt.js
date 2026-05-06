const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// ✅ Safe Date Formatter
const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB");
  } catch {
    return "";
  }
};

// ✅ Safe Number Formatter
const formatNumber = (n) => {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const LedgerPDFHelper = async ({
  reportData = [],
  filters = {},
  header = "",
  subHeader = "",
  corporationName = "",
  logo = ""
}) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/BankDepositRpt.html"
    );

    const htmlFile = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlFile);

    let totalCredit = 0;
    let totalDebit = 0;

    // ✅ Map rows safely
    const rows = (reportData || []).map((r, index) => {
      const credit = Number(r.CREDIT || 0);
      const debit = Number(r.DEBIT || 0);

      totalCredit += credit;
      totalDebit += debit;

      return {
        SR: index + 1,
        DATE: formatDate(r.TRNSDATE),
        TRANSNO: r.TRANSNO || "",
        DOCNO: r.DOCNO || "",
        GLCODE: r.GLCODE || "",
        GLNAME: r.GLNAME || "",
        ACCNO: r.ACCNO || "",
        ACCNAME: r.ACCNAME || "",
        ZONE: r.DEPTNAME || "",
        CREDIT: formatNumber(credit),
        DEBIT: formatNumber(debit)
      };
    });

    // ✅ Inject into template
    const html = template({
      logo,
      corporationName,
      header,
      subHeader,
      fromDate: filters.fromDate || "",
      toDate: filters.toDate || "",
      rows,
      totalCredit: formatNumber(totalCredit),
      totalDebit: formatNumber(totalDebit)
    });

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

    const browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true
    });

    await browser.close();

    // ✅ Save PDF
    const dir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileName = `Ledger_${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (err) {
    console.error("Ledger PDF Error:", err);
    throw err;
  }
};

module.exports = { LedgerPDFHelper };