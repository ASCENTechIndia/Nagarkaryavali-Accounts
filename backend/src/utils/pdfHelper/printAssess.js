const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");


// Convert image to base64
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const generateSplNoticePDF = async ({
  assesment,
  usage,
  totalAmount,
  amountInWords,
  printDate,
}) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/printAssess.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error("Assessment HTML template not found");
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
        
Handlebars.registerHelper("formatDate", function (dateValue) {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (isNaN(d)) return "";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
});

    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    const html = template({
      corporationName: "Nashik Municipal Corporation",
      logo,
      assesment,
      usage,
      totalAmount,
      amountInWords,
      printDate,
    });


    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );
    const browser = await puppeteer.launch({
      headless: true,executablePath:chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Assessment_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();

    fs.writeFileSync(outputPath, finalBytes);

    return { fileName, outputPath };
  } catch (err) {
    console.error("❌ Assessment PDF generation error:", err);
    throw err;
  }
};

module.exports = generateSplNoticePDF;
