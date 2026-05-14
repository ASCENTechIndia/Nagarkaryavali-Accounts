const puppeteer = require("puppeteer");

const fs = require("fs");

const path = require("path");

const Handlebars = require("handlebars");

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-GB");
};

const formatTime = () => {
  return new Date().toLocaleTimeString("en-US");
};

async function generateReceiptPaymentRegisterPDF({ reportData, corporationName, corporationLogo }) {
  try {
    // TEMPLATE PATH

    const templatePath = path.resolve(__dirname, "../../templates/ReceiptPaymentRegister.html");

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");

    const template = Handlebars.compile(htmlTemplate);

    // HTML DATA

    const html = template({
      corporationName,

      corporationLogo,

      rows: reportData.rows.map((x, index) => ({
        srNo: index + 1,

        trnsdate: formatDate(x.TRNSDATE),

        docno: x.DOCNO || "",

        transno: x.TRANSNO || "",

        accname: x.ACCNAME || "",

        narration: x.NARRATION || "",

        adataaccname: x.ADATA_ACCNAME || "",

        receiptamt: formatNumber(x.RECEIPTAMT),

        paymentamt: formatNumber(x.PAYMENTAMT),
      })),

      openingBal: formatNumber(Math.abs(reportData.openingBal || 0)),

      receiptTotal: formatNumber(reportData.receiptTotal),

      paymentTotal: formatNumber(reportData.paymentTotal),

      closingBal: formatNumber(Math.abs(reportData.closingBal || 0)),

      fromDate: reportData.fromDate,

      toDate: reportData.toDate,

      printDate: formatDate(new Date()),

      printTime: formatTime(),
    });

    // CHROME PATH

    const chromePath = path.resolve(__dirname, "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe");

    const launchOptions = {
      headless: true,

      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    // BROWSER

    const browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 0
    });

    // PDF PATH

    const fileName = `ReceiptPaymentRegister_${Date.now()}.pdf`;

    const filePath = path.resolve("public/pdf", fileName);

    // GENERATE PDF

    await page.pdf({
      path: filePath,

      format: "A4",

      landscape: true,

      printBackground: true,

      margin: {
        top: "10px",
        bottom: "10px",
        left: "10px",
        right: "10px",
      },
    });

    await browser.close();

    return {
      fileName,
      filePath,
    };
  } catch (err) {
    console.error("RECEIPT PAYMENT REGISTER PDF ERROR:", err);

    throw err;
  }
}

module.exports = {
  generateReceiptPaymentRegisterPDF,
};
