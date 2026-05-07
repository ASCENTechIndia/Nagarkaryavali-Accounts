const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

Handlebars.registerHelper("range", function(start, end) {
  let arr = [];

  for (let i = start; i <= end; i++) {
    arr.push(i);
  }

  return arr;
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-GB");
};

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN");
};

const MonthlySummaryPDFHelper = async ({
  reportData,
  filters,
  ulbInfo
}) => {

  try {

    if (!reportData.length) {
      throw new Error("No data");
    }

    const templatePath = path.resolve(
      __dirname,
      "../../templates/MonthlySummary.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");

    const template = Handlebars.compile(templateHtml);

    // 🔥 ROW MAPPING
    const rows = reportData.map((row, index) => {

      const days = [];

      for (let i = 1; i <= 31; i++) {

        days.push(
          formatNumber(row[`D${i}`] || 0)
        );
      }

      return {

        SRNO: index + 1,

        GLCODE: row.GLCODE,
        GLNAME: row.GLNAME,

        ACCNO: row.ACCNO,
        ACCNAME: row.ACCNAME,

        FUNCTIONCODE: row.FUNCTIONCODE,
        OBJECTCODE: row.OBJECTCODE,

        BUDGAMOUT: formatNumber(row.BUDGAMOUT),
        BUDGPROV: formatNumber(row.BUDGPROV),

        PREVAMT: formatNumber(row.PREVAMT),

        TOTAL_FOR_MONTH: formatNumber(row.TOTAL_FOR_MONTH),

        PROGRESSIVE_TOTAL: formatNumber(row.PROGRESSIVE_TOTAL),

        BUDGET_BALANCE: formatNumber(row.BUDGET_BALANCE),

        DAYS: days
      };

    });

    // 🔥 TITLE
    let subtitle = "Monthly Budget Report";

    if (filters.rptType === "EXP") {

      subtitle = "Monthly Expenditure Budget Report";

    }

    const html = template({

      logo: ulbInfo?.ULBLOGO || "",

      corporationName:
        ulbInfo?.ABC_MUNICIPAL_TEXT ||
        "अहिल्यानगर महानगरपालिका",

      subtitle,

      fromDate: formatDate(filters.fromDate),

      toDate: formatDate(filters.toDate),

      rows,

      currentDate: new Date().toLocaleString("en-IN")
    });

    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
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

    await page.close();

    await browser.close();

    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf"
    );

    if (!fs.existsSync(outputDir)) {

      fs.mkdirSync(outputDir, {
        recursive: true
      });
    }

    const fileName =
      `Monthly_Summary_${Date.now()}.pdf`;

    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return {
      fileName,
      filePath
    };

  } catch (error) {

    console.error("PDF Error:", error);

    throw error;
  }

};

module.exports = {
  MonthlySummaryPDFHelper
};