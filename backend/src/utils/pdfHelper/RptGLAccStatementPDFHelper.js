const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// ================= FORMAT NUMBER =================
const formatNumber = (num) => {
  if (num === null || num === undefined) return "";

  return Math.abs(Number(num)).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ================= FORMAT DATE =================
const formatDate = (date) => {
  if (!date) return "";

  try {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return date; // if already formatted like 20-MAY-2026
    }

    return d.toLocaleDateString("en-GB");
  } catch {
    return "";
  }
};

// ================= FORMAT BALANCE =================
const formatBalance = (num, suffix = "") => {
  if (num === null || num === undefined) return "";

  const value = Number(num);

  const formatted = Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return suffix ? `${formatted} ${suffix}` : formatted;
};

// ================= PDF GENERATOR =================
const generateTransactionPDF = async ({
  data,
  type,
  filters,
  ulbInfo = {},
}) => {
  try {
    // ================= TEMPLATE =================
    const templatePath = path.resolve(
      __dirname,
      "../../templates/RptGLAccStatement.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    // ================= CORPORATION INFO =================
    const corporationName =
      ulbInfo?.ABC_MUNICIPAL_TEXT ||
      ulbInfo?.CORPORATIONNAME ||
      ulbInfo?.corporationname ||
      ulbInfo?.CORPNAME ||
      ulbInfo?.corpname ||
      ulbInfo?.ULBNAME ||
      ulbInfo?.ulbname ||
      "Municipal Corporation";

    const logoUrl =
      ulbInfo?.ULBLOGO ||
      ulbInfo?.LOGOURL ||
      ulbInfo?.logoUrl ||
      ulbInfo?.logo ||
      ulbInfo?.LOGO ||
      "";

    // ================= HEADER TITLE =================
    const functionCode = filters.functioncode || "";
    const objectCode = filters.objectcode || "";

    const reportTitle = `GL Account Statement [${functionCode}${
      objectCode ? ` / ${objectCode}` : ""
    }], ${type === "details" ? "Details" : "Summary"}`;

    // ================= DATE RANGE =================
    const formattedFromDate = filters.fromDate || "";
    const formattedToDate = filters.toDate || "";

    const dateRangeText = `अहवालाचा कालावधी दिनांक : ${formattedFromDate} पासून ${formattedToDate} पर्यंत`;

    // ================= TOTALS =================
    let totalCredit = 0;
    let totalDebit = 0;
    let closingBalance = 0;
    let closingBalanceSuffix = "";

    // ================= ROW PREPARATION =================
    const rows = (data || []).map((row) => {
      const credit = Number(row.CREDIT || 0);
      const debit = Math.abs(Number(row.DEBIT || 0));
      const balance = Number(row.BALANCE || 0);

      totalCredit += credit;
      totalDebit += debit;

      // Last row balance
      closingBalance = balance;

      closingBalanceSuffix =
        row.CRDR ||
        row.CRDRCLOSE ||
        row.CRDR_CLOSE ||
        "";

      return {
        trnsdate: formatDate(row.TRNSDATE),
        transno: row.TRANSNO || "",
        narration: row.NARRATION || "",
        chqno: row.CHQNO || "",
        chqdate: formatDate(row.CHQDATE),
        docno: row.DOCNO || "",
        credit: formatNumber(credit),
        debit: formatNumber(debit),
        balance: formatBalance(
          balance,
          row.CRDR || row.CRDRCLOSE || row.CRDR_CLOSE || ""
        ),
      };
    });

    // ================= GENERATE HTML =================
    const html = template({
      rows,
      filters,
      type,
      showDetails: type === "details",

      // Header data
      corporationName,
      logoUrl,
      reportTitle,
      dateRangeText,

      // Totals
      totalCredit: formatNumber(totalCredit),
      totalDebit: formatNumber(totalDebit),
      totalBalance: formatBalance(
        closingBalance,
        closingBalanceSuffix
      ),

      printDate: new Date().toLocaleString("en-GB"),
    });

    // ================= CHROME PATH =================
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    // Use local Chrome executable if exists
    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    // ================= LAUNCH BROWSER =================
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    // ================= OUTPUT DIRECTORY =================
    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ================= OUTPUT FILE =================
    const timestamp = Date.now();
    const fileName = `GL_Account_Statement_${timestamp}.pdf`;
    const filePath = path.join(outputDir, fileName);

    // ================= GENERATE PDF =================
    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: type === "details",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "35px",
        left: "20px",
        right: "20px",
      },
      // displayHeaderFooter: true,
    
    });

    await page.close();
    await browser.close();

    return {
      fileName,
      filePath,
    };
  } catch (err) {
    console.error("TRANSACTION PDF ERROR:", err);
    throw err;
  }
};

module.exports = {
  generateTransactionPDF,
};