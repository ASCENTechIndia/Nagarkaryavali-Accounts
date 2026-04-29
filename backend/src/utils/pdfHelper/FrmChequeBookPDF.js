const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// ================= IMAGE BASE64 =================
const imageToBase64 = (imgPath) => {
  try {
    if (!imgPath) return "";
    if (imgPath.startsWith("data:image")) return imgPath;
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};

// ================= FORMAT =================
const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB");
};

let batchSize = 15;

const batchDataIntoPages = (data, batchSize) => {
  const pages = [];
  for (let i = 0; i < data.length; i += batchSize) {
    pages.push({
      rows: data.slice(i, i + batchSize),
      pageNumber: Math.floor(i / batchSize) + 1,
    });
  }
  return pages;
};

// ================= MAIN =================
const generateChequeBookPDF = async ({ data, filters, corporationName, corporationLogo }) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/FrmChequeBook.html");

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    // Header dynamic text
    const headerText = `धनादेश : ${filters.chequeFrom || ''} पासून ${filters.chequeTo || ''} पर्यंत. बँक जी.एल.:${filters.majorCode || ''} बँक खाते:${filters.bankAcc || ''}`;

    // Logo
    const logo = imageToBase64(corporationLogo);

    // Format the data rows
    const formattedRows = data.map((row) => ({
      chqbookno: row.CHQBOOKNO || "",
      chqno: row.CHQNO || "",
      trnsno: row.TRNSNO || "",
      trnsdate: formatDate(row.TRNSDATE),
      trnstype: row.TRNSTYPE || "",
      docno: row.DOCNO || "",
      chqdate: formatDate(row.CHQDATE),
      zone: row.ZONE || "",
      amount: `${row.CRDR || ""} ${row.AMOUNT || ""}`.trim(),
      major: row.FUNCTIONCODE || "",
      minor: row.OBJECTCODE || "",
      minorname: row.ACCNAME || "",
      party: row.PARTYNAME || "",
    }));

    const pages = batchDataIntoPages(formattedRows, batchSize);

    // Get current date and time for footer
    const now = new Date();
    const currentDate = now.toLocaleDateString("en-GB");
    const currentTime = now.toLocaleTimeString();

    const html = template({
      pages,
      headerText,
      logo,
      corporationName: corporationName || "",
      currentDate,
      currentTime,
    });

    let chromePath = null;
    const possiblePaths = [
      path.resolve(__dirname, "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"),
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        chromePath = possiblePath;
        break;
      }
    }

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

    const fileName = `ChequeBook_${filters.chequeFrom || 'start'}_to_${filters.chequeTo || 'end'}_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: true,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>`,
      margin: {
        top: "120px",
        bottom: "60px",
        left: "30px",
        right: "30px",
      },
    });

    await page.close();
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

module.exports = { generateChequeBookPDF };