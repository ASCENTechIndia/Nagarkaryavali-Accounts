const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// helper utils (reuse if already present)
const imageToBase64 = (imgPath) => {
  try {
    if (!imgPath) return null;
    const ext = path.extname(imgPath).replace(".", "");
    const data = fs.readFileSync(imgPath);
    return `data:image/${ext};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
};

const formatDate = (date) => {
  if (!date) return "";

  // Case 1: DD/MM/YYYY (API format)
  if (typeof date === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }

  // Case 2: ISO / timestamp
  const d = new Date(date);
  if (!isNaN(d)) {
    return d.toLocaleDateString("en-GB");
  }

  return "";
};

// batch pagination (same as your previous logic)
const batchDataIntoPages = (data, batchSize = 20) => {
  const pages = [];
  for (let i = 0; i < data.length; i += batchSize) {
    pages.push({
      rows: data.slice(i, i + batchSize),
    });
  }
  return pages;
};

// Handlebars helper
Handlebars.registerHelper("add", (a, b) => a + b);

// ================= MAIN FUNCTION =================
const generateSDRefundPDF = async ({
  data,
  filters,
  corporationName,
  corporationLogo,
}) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/FrmSdRefundRpt.html"
    );

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    Handlebars.registerHelper("ifLastPage", function (index, totalPages, options) {
      if (index === totalPages - 1) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // ✅ HEADER TEXT (date range)
    const headerText = `${filters.fromDate || ""} पासून ${filters.toDate || ""} पर्यंत`;

    // ✅ LOGO
    const logo = corporationLogo;

    // ✅ FORMAT DATA (map DB → template)
    const formattedRows = data.map((row) => ({
      RECTRNSDATE: formatDate(row.RECTRNSDATE),
      RECNO: row.RECNO || "",
      PARTYID: row.PARTYID || "", // party code
      PARTYNAME: row.PARTYNAME || "",
      NIDHINAME: row.NIDHINAME || "",
      ACCNAME: row.ACCNAME || "",
      CERTINO: row.CERTINO || "",
      SDDT: formatDate(row.SDDT),
      amount: row.AMOUNT ? Number(row.AMOUNT).toFixed(2) : "0.00",
    }));

    const pages = batchDataIntoPages(formattedRows, 20);

    // footer date/time
    const now = new Date();
    const currentDate = now.toLocaleDateString("en-GB");
    const currentTime = now.toLocaleTimeString();

    // ✅ GRAND TOTAL
    const grandTotal = formattedRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    const html = template({
      pages,
      headerText,
      logo,
      corporationName,
      currentDate,
      currentTime,
      grandTotal: grandTotal.toFixed(2),
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

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `SD_Refund_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: false,
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();

    return {
      fileName,
      filePath,
    };
  } catch (err) {
    console.error("PDF ERROR:", err);
    throw err;
  }
};

module.exports = {
  generateSDRefundPDF,
};