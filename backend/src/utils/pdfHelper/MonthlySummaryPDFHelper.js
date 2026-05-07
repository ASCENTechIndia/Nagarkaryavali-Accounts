const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

Handlebars.registerHelper("range", function (start, end) {
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

        PREVAMT: formatNumber(Math.abs(row.PREVAMT || 0)),

        TOTAL_FOR_MONTH: formatNumber(
          Math.abs(row.TOTAL_FOR_MONTH || 0)
        ),

        TOTAL_END_OF_MONTH: formatNumber(
          Math.abs(row.PREVAMT || 0) +
          Math.abs(row.PREVAMT || 0)
        ),

        PROGRESSIVE_TOTAL: formatNumber(
          Math.abs(row.PROGRESSIVE_TOTAL || 0)
        ),

        BUDGET_BALANCE: formatNumber(
          Math.abs(row.BUDGET_BALANCE || 0)
        ),
        DAYS: days
      };

    });

    // 🔥 GRAND TOTAL
    const grandTotal = {

      BUDGAMOUT: 0,
      BUDGPROV: 0,

      PREVAMT: 0,
      TOTAL_FOR_MONTH: 0,
      TOTAL_END_OF_MONTH: 0,
      PROGRESSIVE_TOTAL: 0,
      BUDGET_BALANCE: 0,

      DAYS: Array(31).fill(0)

    };

    reportData.forEach((row) => {

      grandTotal.BUDGAMOUT += Math.abs(
        Number(row.BUDGAMOUT || 0)
      );

      grandTotal.BUDGPROV += Math.abs(
        Number(row.BUDGPROV || 0)
      );

      grandTotal.PREVAMT += Math.abs(
        Number(row.PREVAMT || 0)
      );

      grandTotal.TOTAL_FOR_MONTH += Math.abs(
        Number(row.TOTAL_FOR_MONTH || 0)
      );

      grandTotal.TOTAL_END_OF_MONTH +=
        Math.abs(Number(row.PREVAMT || 0))

      grandTotal.PROGRESSIVE_TOTAL += Math.abs(
        Number(row.PROGRESSIVE_TOTAL || 0)
      );

      grandTotal.BUDGET_BALANCE += Math.abs(
        Number(row.BUDGET_BALANCE || 0)
      );

      for (let i = 1; i <= 31; i++) {

        grandTotal.DAYS[i - 1] += Math.abs(
          Number(row[`D${i}`] || 0)
        );

      }

    });

    // FORMAT TOTALS
    grandTotal.BUDGAMOUT = formatNumber(
      grandTotal.BUDGAMOUT
    );

    grandTotal.BUDGPROV = formatNumber(
      grandTotal.BUDGPROV
    );

    grandTotal.PREVAMT = formatNumber(
      grandTotal.PREVAMT
    );

    grandTotal.TOTAL_FOR_MONTH = formatNumber(
      grandTotal.TOTAL_FOR_MONTH
    );

    grandTotal.TOTAL_END_OF_MONTH = formatNumber(
      grandTotal.TOTAL_END_OF_MONTH
    );

    grandTotal.PROGRESSIVE_TOTAL = formatNumber(
      grandTotal.PROGRESSIVE_TOTAL
    );

    grandTotal.BUDGET_BALANCE = formatNumber(
      grandTotal.BUDGET_BALANCE
    );

    grandTotal.DAYS = grandTotal.DAYS.map((d) =>
      formatNumber(d)
    );



    // 🔥 TITLE
    let subtitle = "क्लासिफाईड रजिस्टर डिटेल्स";

    // if (filters.rptType === "EXP") {

    //   subtitle = "Monthly Expenditure Budget Report";

    // }

    const html = template({

      logo: ulbInfo?.ULBLOGO || "",

      corporationName:
        ulbInfo?.ABC_MUNICIPAL_TEXT ||
        "अहिल्यानगर महानगरपालिका",

      subtitle,

      fromDate: formatDate(filters.fromDate),

      toDate: formatDate(filters.toDate),

      rows,
      grandTotal,

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