const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB");

const formatNumber = (num) =>
  Number(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const BudgetExpenditurePDFHelper = async ({ reportData, filters, ulbInfo }) => {
  try {
    if (!reportData.length) throw new Error("No data");

    const templatePath = path.resolve(
      __dirname,
      "../../templates/BudgetAbstractExpenditure.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    let totalActual = 0;
    let totalExpenditure = 0;
    let totalBudget = 0;
    let totalBalance = 0;

    const rows = reportData.map((row) => {
      const actual = Number(row.ACTUAL_PAYMENT || 0);
      const budget = Number(row.BUDGPROV || 0);
      const balance = Number(row.BALANCE || 0);

      totalActual += actual;
      totalExpenditure += actual;
      totalBudget += budget;
      totalBalance += balance;

      return {
        ACCOUNTCODE: row.ACCOUNTCODE,
        ACCNAME: row.ACCNAME,
        ACTUAL: formatNumber(actual),
        EXPENDITURE: formatNumber(actual),
        BUDGET: formatNumber(budget),
        BALANCE: formatNumber(balance)
      };
    });

    const html = template({
      corporationName: ulbInfo.ABC_MUNICIPAL_TEXT,
      fromDate: formatDate(filters.fromDate),
      toDate: formatDate(filters.toDate),
      rows,
      totalActual: formatNumber(totalActual),
      totalExpenditure: formatNumber(totalExpenditure),
      totalBudget: formatNumber(totalBudget),
      totalBalance: formatNumber(totalBalance),
      currentDate: new Date().toLocaleString("en-IN")
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Budget_Expenditure_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (error) {
    console.error("PDF Error:", error);
    throw error;
  }
};

module.exports = {
  BudgetExpenditurePDFHelper
};