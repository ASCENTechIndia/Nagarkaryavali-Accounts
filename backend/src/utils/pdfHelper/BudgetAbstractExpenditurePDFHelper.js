
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-GB");
};

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const BudgetExpenditurePDFHelper = async ({
  reportData,
  filters,
  ulbInfo,
}) => {
  try {
    if (!reportData || !reportData.length) {
      throw new Error("No data found");
    }

    // =========================================================
    // rptType = 0  => RECEIPT PDF
    // rptType = 1  => PAYMENT PDF
    // =========================================================

    const isReceipt = filters.rptType === "0";

    let templateFile = "";
    let htmlData = {};

    // =========================================================
    // RECEIPT PDF
    // =========================================================

    if (isReceipt) {
      templateFile = "BudgetAbstractExpenditure.html";

      let totalActual = 0;
      let totalExpenditure = 0;
      let totalBudget = 0;
      let totalBalance = 0;
      let totalExcess = 0;

      const rows = reportData.map((row) => {
        const actual = Number(row.ACTUAL_PAYMENT || 0);

        const budget = Number(row.BUDGPROV || 0);

        const rawBalance = Number(row.BALANCE || 0);

        let finalBalance = 0;
        let excessAmount = 0;

        // .NET logic
        if (actual > budget) {
          finalBalance = 0;
          excessAmount = rawBalance;
        } else {
          finalBalance = rawBalance;
          excessAmount = 0;
        }

        const absActual = Math.abs(actual);

        const absBudget = Math.abs(budget);

        const absBalance = Math.abs(finalBalance);

        const absExcess = Math.abs(excessAmount);

        totalActual += absActual;
        totalExpenditure += absActual;
        totalBudget += absBudget;
        totalBalance += absBalance;
        totalExcess += absExcess;

        return {
          ACCOUNTCODE: row.ACCOUNTCODE,
          ACCNAME: row.ACCNAME,
          ACTUAL: formatNumber(absActual),
          EXPENDITURE: formatNumber(absActual),
          BUDGET: formatNumber(absBudget),
          BALANCE: formatNumber(absBalance),
          EXCESS: formatNumber(absExcess),
        };
      });

      htmlData = {
        corporationName:
          ulbInfo?.ABC_MUNICIPAL_TEXT || "Municipal Corporation",

        fromDate: formatDate(filters.fromDate),

        toDate: formatDate(filters.toDate),

        currentDate: new Date().toLocaleDateString("en-GB"),

        currentTime: new Date().toLocaleTimeString("en-IN"),

        rows,

        totalActual: formatNumber(totalActual),

        totalExpenditure: formatNumber(totalExpenditure),

        totalBudget: formatNumber(totalBudget),

        totalBalance: formatNumber(totalBalance),

        totalExcess: formatNumber(totalExcess),
      };
    }

    // =========================================================
    // PAYMENT PDF
    // =========================================================

    else {
      templateFile = "BudgetAbstractPayment.html";

      let groupedRows = [];

      let grandActual = 0;
      let grandExp = 0;
      let grandBudget = 0;
      let grandBalance = 0;

      const grouped = {};

      // Grouping
      reportData.forEach((row) => {
        const typeNo = row.ACCNO_TYPE_NO || "";

        const typeName = row.ACCNO_TYPE_NAME || "";

        if (!grouped[typeNo]) {
          grouped[typeNo] = {
            typeName,
            rows: [],
          };
        }

        grouped[typeNo].rows.push(row);
      });

      // Prepare grouped rows
      Object.keys(grouped)
        .sort()
        .forEach((key) => {
          const group = grouped[key];

          let subActual = 0;
          let subExp = 0;
          let subBudget = 0;
          let subBalance = 0;

          // Group Header
          groupedRows.push({
            isGroupHeader: true,
            accountCode: key,
            accountName: group.typeName,
          });

          group.rows.forEach((row) => {
            const actual = Math.abs(
              Number(row.ACTUAL_PAYMENT || 0)
            );

            const exp =
              row.PROGRESSIVE_TOTAL != null
                ? Math.abs(
                    Number(row.PROGRESSIVE_TOTAL || 0)
                  )
                : Math.abs(
                    Number(row.EXPENDITURE || 0)
                  );

            const budget = Math.abs(
              Number(row.BUDGPROV || 0)
            );

            // .NET logic
            const balance = budget - actual;

            subActual += actual;
            subExp += exp;
            subBudget += budget;
            subBalance += balance;

            groupedRows.push({
              isData: true,

              ACCOUNTCODE: row.ACCOUNTCODE,

              ACCNAME: row.ACCNAME,

              ACTUAL: formatNumber(actual),

              EXPENDITURE: formatNumber(exp),

              BUDGET: formatNumber(budget),

              BALANCE: formatNumber(balance),
            });
          });

          // Sub Total
          groupedRows.push({
            isSubTotal: true,

            ACTUAL: formatNumber(subActual),

            EXPENDITURE: formatNumber(subExp),

            BUDGET: formatNumber(subBudget),

            BALANCE: formatNumber(subBalance),
          });

          grandActual += subActual;
          grandExp += subExp;
          grandBudget += subBudget;
          grandBalance += subBalance;
        });

      htmlData = {
        corporationName:
          ulbInfo?.ABC_MUNICIPAL_TEXT || "Municipal Corporation",

        fromDate: formatDate(filters.fromDate),

        toDate: formatDate(filters.toDate),

        currentDate: new Date().toLocaleDateString("en-GB"),

        currentTime: new Date().toLocaleTimeString("en-IN"),

        rows: groupedRows,

        grandActual: formatNumber(grandActual),

        grandExp: formatNumber(grandExp),

        grandBudget: formatNumber(grandBudget),

        grandBalance: formatNumber(grandBalance),
      };
    }

    // =========================================================
    // LOAD TEMPLATE
    // =========================================================

    const templatePath = path.resolve(
      __dirname,
      `../../templates/${templateFile}`
    );

    const templateHtml = fs.readFileSync(
      templatePath,
      "utf8"
    );

    const template = Handlebars.compile(templateHtml);

    const html = template(htmlData);

    // =========================================================
    // PUPPETEER
    // =========================================================

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

    const browser = await puppeteer.launch(
      launchOptions
    );

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,

      margin: {
        top: "10px",
        right: "10px",
        bottom: "10px",
        left: "10px",
      },
    });

    await page.close();

    await browser.close();

    // =========================================================
    // SAVE PDF
    // =========================================================

    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {
        recursive: true,
      });
    }

    const fileName = `${
      isReceipt ? "Receipt" : "Payment"
    }_${Date.now()}.pdf`;

    const filePath = path.join(
      outputDir,
      fileName
    );

    fs.writeFileSync(filePath, pdfBuffer);

    return {
      fileName,
      filePath,
    };
  } catch (error) {
    console.log("PDF ERROR :", error);

    throw error;
  }
};

module.exports = {
  BudgetExpenditurePDFHelper,
};