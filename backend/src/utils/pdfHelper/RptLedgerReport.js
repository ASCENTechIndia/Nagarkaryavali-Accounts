const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const imageToBase64 = (imgPath) => {
  try {
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};

const formatDate = (date) => {
  // if (!date) return "";
  // return new Date(date).toLocaleDateString("en-GB");
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString('en', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN");
};

const RptLedgerReportPDFHelper = async ({
  transactions,
  openingBalance,
  filters,
  ulbInfo
}) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/RptLedgerReport.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/logo.png");
    const logo = imageToBase64(logoPath);

    let totalDr = 0;
    let totalCr = 0;
    let drCount = 0;
    let crCount = 0;

    const rows = transactions.map((t) => {
      const amount = Number(t.AMOUNT || 0);
      const discountAmount = Number(t.DISCOUNTAMOUNT  || 0);
      const netAmount = Math.abs(amount) - discountAmount;

      let row = {
        DR_ACCOUNT_CODE: "",
        CR_ACCOUNT_CODE: "",

        DR_TRANS_NO: "",
        DR_VOU_NO: "",
        DR_DATE: "",
        DR_PARTICULARS: "",
        DR_CHEQUE: "",
        DR_AMOUNT: "",

        CR_TRANS_NO: "",
        CR_VOU_NO: "",
        CR_DATE: "",
        CR_PAN: "",
        CR_PARTICULARS: "",
        CR_CHEQUE: "",
        CR_AMOUNT: "",
      };

      if (amount >= 0) {
        row.CR_ACCOUNT_CODE = filters.accountCode || "";

        row.CR_TRANS_NO = t.TRANSNO;
        row.CR_VOU_NO = t.DOCNO;
        row.CR_DATE = t.TRNSDATE;
        row.CR_PAN = t.PANCARD || "";
        row.CR_PARTICULARS = t.NARRATION || "";
        row.CR_CHEQUE = t.CHQNO || "";
        row.CR_AMOUNT = formatNumber(netAmount);

        totalCr += netAmount;
        crCount++;
      } else {
        const abs = Math.abs(netAmount);

        row.DR_ACCOUNT_CODE = filters.accountCode || "";

        row.DR_TRANS_NO = t.TRANSNO;
        row.DR_VOU_NO = t.DOCNO;
        row.DR_DATE = t.TRNSDATE;
        row.DR_PARTICULARS = t.NARRATION || "";
        row.DR_CHEQUE = t.CHQNO || "";
        row.DR_AMOUNT = formatNumber(abs);

        totalDr += abs;
        drCount++;
      }
      return row;
    });

    const closingBalance = Math.abs(openingBalance) + totalDr - totalCr;

    console.log("Rows: ", rows);
    console.log("closingBalance: ", closingBalance);
    console.log("openingBalance: ", openingBalance);

    const html = template({
      logo: ulbInfo.ULBLOGO,
      corporationName: ulbInfo.ABC_MUNICIPAL_TEXT,
      accountHead: filters.accountHead || "",
      accountCode: filters.accountCode || "",

      fromDate: formatDate(filters.fromDate),
      toDate: formatDate(filters.toDate),

      openingDr: "0",
      openingCr: formatNumber(Math.abs(openingBalance)),

      rows,

      totalDr: formatNumber(Math.abs(totalDr)),
      totalCr: formatNumber(Math.abs(totalCr)),

      drCount,
      crCount,

      closingDr: "0",
      closingCr: formatNumber(Math.abs(closingBalance)),

      printDate: new Date().toLocaleString("en-IN"),
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
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await page.close();
    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Ledger_GEN3_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };
  } catch (error) {
    console.error("Ledger PDF Error:", error);
    throw error;
  }
};

module.exports = {
  RptLedgerReportPDFHelper,
};