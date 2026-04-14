const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");
const QRCode = require("qrcode");
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

const generateDuplicateReceiptPDF = async ({
  receipt = {},
  corporationName = "Nashik Municipal Corporation",
  recno,
  username = "",
  printDate = "",
  bharnaDate = "",
}) => {
  try {
    if (!receipt || Object.keys(receipt).length === 0) {
      throw new Error("No receipt data provided");
    }

    const templatePath = path.resolve(__dirname, "../../templates/receipt-duplicate.html");
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    const qrCode = await QRCode.toDataURL(`Receipt|${recno}`);

       const chromePath = path.resolve(
          __dirname,
          "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
        );
    const launchOptions = {
      headless: true,executablePath:chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    const browser = await puppeteer.launch(launchOptions);

    // 🔹 Normalize API fields → template fields
    const receiptData = {
      corporationName,
      currentDate: new Date().toLocaleDateString("en-GB"),
      logo,
      qrCode,
      recno,
      propno: receipt.propno,
      zonename: receipt.zone_name,
      owner: receipt.owner_name,
      address: receipt.address,
      occupantName: receipt.occupier_name,
      payer: receipt.payer,
      ratotamt: receipt.arrears_demand,
      rctotamt: receipt.current_demand,
      discount: receipt.discount,
      abhaydis: receipt.abhay_discount,
      advancedamt: receipt.advance_amt,
      totreceivedamt: receipt.total_amt,
      username,
      printDate,
      bharnaDate,
      amtinwords: amountInWords(receipt.total_amt),
    };

    const html = template(receiptData);

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

    const fileName = `Receipt_${recno}_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { fileName, outputPath };
  } catch (error) {
    console.error("❌ Receipt PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  amountInWords,
  imageToBase64,
  generateDuplicateReceiptPDF,
};
