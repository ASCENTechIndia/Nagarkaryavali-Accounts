const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");
const QRCode = require("qrcode");

const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const formatDateDDMMYYYY = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const generateDailyTaxwisePDF = async ({
  collectionData = [],
  corporationName = "Nashik Municipal Corporation",
  printDate = "",
  fromDate,
  toDate,
  username
}) => {
  try {
    if (!Array.isArray(collectionData) || collectionData.length === 0) {
      throw new Error("No collection data provided");
    }

    const templatePath = path.resolve(
      __dirname,
      "../../templates/daily-taxwise-collrpt.html",
    );
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe",
    );

    const launchOptions = {
      headless: true,
      executablePath: chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    const browser = await puppeteer.launch(launchOptions);

    const qrCode = await QRCode.toDataURL(`DailyTaxwise|${Date.now()}`);

    collectionData = collectionData.map((row) => ({
      ...row,
      receiptdt: formatDateDDMMYYYY(row.receiptdt),
    }));

    const formattedFromDate = formatDateDDMMYYYY(fromDate);
    const formattedToDate = formatDateDDMMYYYY(toDate);
    const formattedPrintDate = formatDateDDMMYYYY(printDate);

    const totalReceiptCount = collectionData.length;

    const totalStamp = collectionData.reduce((sum, row) => {
      return sum + (Number(row.stamp) || 0);
    }, 0);

    const html = template({
      corporationName,
      logo,
      printDate: formattedPrintDate,
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      collectionData,
      totalReceiptCount,
      totalStamp,
      username
    });


    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false,
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `DailyTaxwise_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { fileName, outputPath };
  } catch (error) {
    console.error("❌ Daily Taxwise PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  generateDailyTaxwisePDF,
};
