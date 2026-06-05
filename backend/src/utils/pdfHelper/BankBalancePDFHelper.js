const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// ================= IMAGE BASE64 =================

const imageToBase64 = (imgPath) => {
  try {

    if (!imgPath) return "";

    if (imgPath.startsWith("data:image")) {
      return imgPath;
    }

    const file = fs.readFileSync(imgPath);

    const ext = path.extname(imgPath)
      .replace(".", "");

    return `data:image/${ext};base64,${file.toString("base64")}`;

  } catch {

    return "";
  }
};

// ================= FORMAT =================

const formatDate = (date) => {

  if (!date) return "";

  return new Date(date)
    .toLocaleDateString("en-GB");
};

const formatNumber = (num) => {

  return Math.abs(Number(num || 0))
    .toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
};

// ================= MAIN =================

const BankBalancePDFHelper = async ({
  rows,
  ulbInfo,
  toDate,
}) => {

  try {

    const templatePath = path.resolve(
      __dirname,
      "../../templates/BankBalanceReport.html"
    );

    const htmlTemplate =
      fs.readFileSync(
        templatePath,
        "utf8"
      );

    const template =
      Handlebars.compile(
        htmlTemplate
      );

    // ================= LOGO =================

    const logo =
      imageToBase64(
        ulbInfo?.ULBLOGO
      );

    // ================= GROUP DATA =================

    const groupedData = {
      "Cash Account": [],
      "Bank Account": [],
      "Investment": [],
    };

    let cashTotal = 0;
    let bankTotal = 0;
    let investmentTotal = 0;

    // ================= GROUPING =================

    rows.forEach((row) => {

      const balance =
        Number(row.BALANCE || 0);

      // ================= CASH =================

      if (row.BALSCODE == "4810") {

        groupedData["Cash Account"]
          .push({

            objectCode:
              row.OBJECTCODE || "",

            accName:
              row.ACCNAME || "",

            balance:
              formatNumber(balance),

            crdr:
              row.CRDR || "",
          });

        cashTotal =
          cashTotal + balance;
      }

      // ================= BANK =================

      else if (

        row.BALSCODE == "4820" ||
        row.BALSCODE == "4821" ||
        row.BALSCODE == "4822" ||
        row.BALSCODE == "4823"

      ) {

        groupedData["Bank Account"]
          .push({

            objectCode:
              row.OBJECTCODE || "",

            accName:
              row.ACCNAME || "",

            balance:
              formatNumber(balance),

            crdr:
              row.CRDR || "",
          });

        bankTotal =
          bankTotal + balance;
      }

      // ================= INVESTMENT =================

      else if (
        row.BALSCODE == "9"
      ) {

        groupedData["Investment"]
          .push({

            objectCode:
              row.OBJECTCODE || "",

            accName:
              row.ACCNAME || "",

            balance:
              formatNumber(balance),

            crdr:
              row.CRDR || "",
          });

        investmentTotal =
          investmentTotal + balance;
      }
    });

    // ================= GROUPS =================

    const groups = [];

    Object.keys(groupedData)
      .forEach((groupName) => {

        const rowsData =
          groupedData[groupName];

        if (!rowsData.length) {
          return;
        }

        let total = 0;

        if (groupName === "Cash Account") {
          total = cashTotal;
        }

        if (groupName === "Bank Account") {
          total = bankTotal;
        }

        if (groupName === "Investment") {
          total = investmentTotal;
        }

        groups.push({

          groupName,

          rows: rowsData,

          total:
            formatNumber(total),

          totalCrDr:
            total < 0
              ? "Dr."
              : "Cr.",
        });
      });

    // ================= GRAND TOTAL =================

    const grandTotal =
      cashTotal +
      bankTotal +
      investmentTotal;

    // ================= CURRENT DATE =================

    const now = new Date();

    const currentDate =
      now.toLocaleDateString("en-GB");

    const currentTime =
      now.toLocaleTimeString();
      

    // ================= HTML =================

    const html = template({

      logo,

      corporationName:
        ulbInfo?.ABC_MUNICIPAL_TEXT || "",

      reportDate:
        formatDate(toDate),

      currentDate,

      currentTime,

      groups,

      cashTotal:
        formatNumber(cashTotal),

      cashCrDr:
        cashTotal < 0
          ? "Dr."
          : "Cr.",

      bankTotal:
        formatNumber(bankTotal),

      bankCrDr:
        bankTotal < 0
          ? "Dr."
          : "Cr.",

      investmentTotal:
        formatNumber(investmentTotal),

      investmentCrDr:
        investmentTotal < 0
          ? "Dr."
          : "Cr.",

      grandTotal:
        formatNumber(grandTotal),

      grandCrDr:
        grandTotal < 0
          ? "Dr."
          : "Cr.",
    });

    // ================= CHROME PATH =================

    let chromePath = null;

    const possiblePaths = [

      path.resolve(
        __dirname,
        "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
      ),
    ];

    for (const possiblePath of possiblePaths) {

      if (fs.existsSync(possiblePath)) {

        chromePath = possiblePath;

        break;
      }
    }

    // ================= PUPPETEER =================

    const launchOptions = {

      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    };

    if (chromePath) {
      launchOptions.executablePath =
        chromePath;
    }

    const browser =
      await puppeteer.launch(
        launchOptions
      );

    const page =
      await browser.newPage();

    await page.setContent(html, {

      waitUntil: "networkidle0",

      timeout: 30000,
    });

    // ================= OUTPUT =================

    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf"
    );

    if (!fs.existsSync(outputDir)) {

      fs.mkdirSync(outputDir, {
        recursive: true,
      });
    }

    const fileName =
      `BankBalance_${Date.now()}.pdf`;

    const filePath =
      path.join(
        outputDir,
        fileName
      );

    // ================= PDF =================

    await page.pdf({

      path: filePath,

      format: "A4",

      printBackground: true,

      displayHeaderFooter: true,

      headerTemplate:
        `<div></div>`,

      footerTemplate:
        `
        <div style="
          width:100%;
          font-size:8px;
          padding:0 20px;
          color:#000;
        ">
          <div style="
            width:100%;
            display:flex;
            justify-content:space-between;
          ">
            <span>
              दिनांक :
              ${currentDate}
              ${currentTime}
            </span>

            <span>
              पृष्ठ :
              <span class="pageNumber"></span>
              /
              <span class="totalPages"></span>
            </span>
          </div>
        </div>
        `,

      margin: {

        top: "25px",

        bottom: "45px",

        left: "20px",

        right: "20px",
      },
    });

    await page.close();

    await browser.close();

    return {

      fileName,

      filePath,
    };

  } catch (err) {

    console.error(
      "PDF ERROR:",
      err
    );

    throw err;
  }
};

module.exports = {
  BankBalancePDFHelper,
};