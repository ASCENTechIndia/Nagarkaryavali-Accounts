const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// =======================
// FORMAT HELPERS
// =======================
const formatDate = (d) => {
  if (!d) return "";

  const dt = new Date(d);

  if (isNaN(dt)) return "";

  return dt.toLocaleDateString("en-GB");
};

const formatNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getValueOrAll = (val) => {
  if (
    val === undefined ||
    val === null ||
    val === "" ||
    val === "-1"
  ) {
    return "All";
  }

  return val;
};

// =======================
// MAIN HELPER
// =======================
const RevokeReportGeneration = async ({
  reportData,
  filters,
  corporationName,
  corporationLogo,
}) => {
  try {
    if (!reportData || !reportData.length) {
      throw new Error("No data found for PDF");
    }

    // =======================
    // FILTER HANDLING
    // =======================
    const filterData = {
      type:
        filters.type?.toUpperCase() || "ALL",

      flag:
        filters.flag || "ALL",

      fromDate:
        formatDate(filters.fromDate),

      toDate:
        formatDate(filters.toDate),
    };

    // =======================
    // DATA MAPPING
    // =======================
    let totalAmount = 0;

    const data = reportData.map((row, index) => {
      const amount = Number(
        row.AMOUNT || 0
      );

      totalAmount += amount;

      return {
        srNo: index + 1,

        revokeDate: formatDate(
          row.REVOKEDATE
        ),

        transType:
          row.TRANSTYPE || "",

        transNo:
          row.TRANSNO || "",

        recNo:
          row.RECNO || "",

        transDate: formatDate(
          row.TRANSDATE
        ),

        majorCode:
          row.MAJORCODE || "",

        minorCode:
          row.MINORCODE || "",

        minorCodeName:
          row.MINORCODENAME || "",

        zoneName:
          row.ZONENAME || "",

        chequeNo:
          row.CHEQUENO || "",

        chequeDate: formatDate(
          row.CHEQUEDATE
        ),

        tapshil:
          row.TAPSHIL || "",

        partyName:
          row.PARTYNAME || "",

        arthSankalp:
          row.ARTHSANKALP || "",

        insby:
          row.INSBY || "",

        amount:
          formatNumber(amount),

        revokeRemark:
          row.REVOKEREMARK || "",

        revokeBy:
          row.REVOKEBY || "",
      };
    });

    // =======================
    // TEMPLATE LOAD
    // =======================
    const templatePath = path.resolve(
      __dirname,
      "../../templates/RevokeReportTemplate.html"
    );

    const templateHtml =
      fs.readFileSync(templatePath, "utf8");

    const template =
      Handlebars.compile(templateHtml);

    const html = template({
      corporationName,

      corporationLogo,

      filters: filterData,

      currentDate:
        formatDate(new Date()),

      currentTime:
        new Date().toLocaleTimeString(),

      data,

      totalAmount:
        formatNumber(totalAmount),
    });

    // =======================
    // CHROME SETUP
    // =======================
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath =
        chromePath;
    }

    // =======================
    // BROWSER
    // =======================
    const browser =
      await puppeteer.launch(
        launchOptions
      );

    const page =
      await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    // =======================
    // PDF
    // =======================
    const pdfBuffer =
      await page.pdf({
        format: "A4",

        landscape: true,

        printBackground: true,

        displayHeaderFooter: true,

        headerTemplate:
          `<div></div>`,

        footerTemplate: `
          <div style="font-size:10px;width:100%;text-align:right;padding-right:20px;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `,

        margin: {
          top: "60px",
          bottom: "40px",
          left: "20px",
          right: "20px",
        },
      });

    await page.close();

    await browser.close();

    // =======================
    // SAVE FILE
    // =======================
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
      `RevokeReport_${Date.now()}.pdf`;

    const filePath =
      path.join(outputDir, fileName);

    fs.writeFileSync(
      filePath,
      pdfBuffer
    );

    return {
      fileName,
      filePath,
    };

  } catch (error) {
    console.error(
      "RevokeReport PDF Error:",
      error
    );

    throw error;
  }
};

module.exports = {
  RevokeReportGeneration,
};