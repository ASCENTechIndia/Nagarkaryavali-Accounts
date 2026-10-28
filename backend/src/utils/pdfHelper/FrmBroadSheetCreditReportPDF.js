const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const formatNumber = (num) => {
  if (num === null || num === undefined) return "";
  return Math.round(Number(num)).toString();
};

const getMonthLabels = (startYear) => {
  const y1 = String(startYear).slice(-2); 
  const y2 = String(startYear + 1).slice(-2);

  return [
    `एप्रिल<br/>- ${y1}`,
    `मे<br/>- ${y1}`,
    `जून<br/>- ${y1}`,
    `जुलै<br/>- ${y1}`,
    `ऑगस्ट<br/>- ${y1}`,
    `सप्टेंबर<br/>- ${y1}`,
    `ऑक्टोबर<br/>- ${y1}`,
    `नोव्हेंबर<br/>- ${y1}`,
    `डिसेंबर<br/>- ${y1}`,
    `जानेवारी<br/>- ${y2}`,
    `फेब्रुवारी<br/>- ${y2}`,
    `मार्च<br/>- ${y2}`,
  ];
};

const buildRows = (data) => {
  return data.map((row) => ({
    //accountNo: row.ACCOUNT_NO,
    empName: row.DCPS_NAME,
    dcpsNo: row.DCPS_NO,
    opening: formatNumber(row.OPENING_BALANCE),
    apr: formatNumber(row.APR_AMOUNT),
    may: formatNumber(row.MAY_AMOUNT),
    jun: formatNumber(row.JUN_AMOUNT),
    jul: formatNumber(row.JUL_AMOUNT),
    aug: formatNumber(row.AUG_AMOUNT),
    sep: formatNumber(row.SEP_AMOUNT),
    oct: formatNumber(row.OCT_AMOUNT),
    nov: formatNumber(row.NOV_AMOUNT),
    dec: formatNumber(row.DEC_AMOUNT),
    jan: formatNumber(row.JAN_AMOUNT),
    feb: formatNumber(row.FEB_AMOUNT),
    mar: formatNumber(row.MAR_AMOUNT),
    yearEndInterest: formatNumber(row.YEAR_END_INTEREST),
    totalBalance: formatNumber(row.TOTAL_BALANCE),
  }));
};

const generateBroadSheetCreditPDF = async ({ data, yearId }) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/BroadSheetCreditReport.html"
    );

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    const rows = buildRows(data);
    const months = getMonthLabels(Number(yearId));

    console.log("Broad Sheet rows count:", rows.length);

    const html = template({
      rows,
      months,
      yearLabel: `${yearId}-${String(Number(yearId) + 1).slice(-2)}`,
      printDate: new Date().toLocaleString("en-GB"),
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

    await page.setContent(html, { waitUntil: "networkidle0" });

    const fileName = `BroadSheetCreditReport_${Date.now()}.pdf`;
    const filePath = path.resolve("public/pdf", fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: false,
      printBackground: true,
      margin: {
        top: "30px",
        bottom: "30px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();

    return { fileName, filePath };
  } catch (err) {
    console.error("Broad Sheet PDF ERROR:", err);
    throw err;
  }
};

module.exports = { generateBroadSheetCreditPDF };