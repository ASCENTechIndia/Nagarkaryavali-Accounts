const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const formatNumber = (num) => {
  if (num === null || num === undefined) {
    return "0";
  }

  return Number(num).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const generateConsolidatedReceiptPDF = async ({ data, fromDate, toDate, reportType, departmentName, wardName }) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/FrmConsolidatedReceipt.html");

    const templateHtml = fs.readFileSync(templatePath, "utf8");

    Handlebars.registerHelper("ifEquals", function (a, b, options) {
      if (String(a) === String(b)) {
        return options.fn(this);
      }

      return options.inverse(this);
    });

    const template = Handlebars.compile(templateHtml);

    let totalTransaction = 0;
    let totalCash = 0;
    let totalCheque = 0;
    let totalBank = 0;
    let totalOnline = 0;
    let grandTotal = 0;

    let currentDept = "";

    let rows = [];

    data.forEach((row, index) => {
      totalTransaction += Number(row.NOOFTRANSACTION || 0);

      totalCash += Number(row.CASHAMT || 0);

      totalCheque += Number(row.CHEQUEAMT || 0);

      totalBank += Number(row.BANKAMT || 0);

      totalOnline += Number(row.ONLINEAMT || 0);

      grandTotal += Number(row.TOTAL || 0);

      const isNewDept = currentDept !== row.DEPARTMENT;

      if (isNewDept) {
        currentDept = row.DEPARTMENT;
      }

      rows.push({
        srNo: index + 1,

        recDate: row.RECDATE ? new Date(row.RECDATE).toLocaleDateString("en-GB") : "",

        // ONLY FIRST ROW OF GROUP
        department: isNewDept ? row.DEPARTMENT : "",

        accountHead: row.ACCOUNTHEAD || "",

        accountDescription: row.ACCDESCRIPTION || "",

        transactionCount: row.NOOFTRANSACTION || 0,

        cashAmt: formatNumber(row.CASHAMT || 0),

        chequeAmt: formatNumber(row.CHEQUEAMT || 0),

        bankAmt: formatNumber(row.BANKAMT || 0),

        onlineAmt: formatNumber(row.ONLINEAMT || 0),

        total: formatNumber(row.TOTAL || 0),
      });
    });

    const totalRows = rows.length;

    // APPROX PAGE CALCULATION
    const rowsPerPage = 18;

    const totalPages = Math.ceil(totalRows / rowsPerPage);

    const pageText = `Page 1 of ${totalPages}`;

    const html = template({
      corporationName: "अहिल्यानगर महानगरपालिका, अहिल्यानगर",

      printDate: new Date().toLocaleDateString("en-GB"),

      printTime: new Date().toLocaleTimeString("en-US"),

      fromDate,
      toDate,

      ward: wardName || "ALL",
      department: departmentName || "ALL",

      rows,

      showDateColumn: reportType === "1",
      
      pageText,

      totalTransaction,

      totalCash: formatNumber(totalCash),

      totalCheque: formatNumber(totalCheque),

      totalBank: formatNumber(totalBank),

      totalOnline: formatNumber(totalOnline),

      grandTotal: formatNumber(grandTotal),
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

    await page.setViewport({
      width: 1600,
      height: 1200,
    });

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    const fileName = `ConsolidatedReceipt_${Date.now()}.pdf`;

    const filePath = path.resolve("public/pdf", fileName);

    await page.pdf({
      path: filePath,

      format: "A4",

      landscape: true,

      printBackground: true,

      preferCSSPageSize: true,

      margin: {
        top: "15px",
        bottom: "15px",
        left: "15px",
        right: "15px",
      },
    });

    await browser.close();

    return {
      fileName,
      filePath,
    };
  } catch (err) {
    console.error("CONSOLIDATED RECEIPT PDF ERROR:", err);

    throw err;
  }
};

module.exports = {
  generateConsolidatedReceiptPDF,
};
