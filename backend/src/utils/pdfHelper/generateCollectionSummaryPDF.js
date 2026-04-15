const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");
const numberToWords = require("number-to-words");

// Convert number to words
const amountInWords = (amount) => {
  if (!amount) return "";
  const num = Math.floor(Number(amount));
  if (isNaN(num)) return "";
  return `${numberToWords.toWords(num)} rupees only`;
};

// Convert image to base64
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const generateCollectionSummaryPDF = async ({
  taxData = [],
  totals = {},
  corporationName = "Nashik Municipal Corporation",
  printDate = "",
  isLastPage = false,
}) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/receipt-position-report-all.html");
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    const receiptData = {
      corporationName,
      logo,
      taxData,
      totals,
      isLastPage,
      amountInWords: amountInWords(totals.totalReceipt),
      printDate,
    };

    const html = template(receiptData);

    const chromePath = path.resolve(
          __dirname,
          "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
        );
    const browser = await puppeteer.launch({
      headless: true,executablePath:chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `CollectionSummary_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { fileName, outputPath };
  } catch (error) {
    console.error("❌ Collection Summary PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  generateCollectionSummaryPDF,
};
