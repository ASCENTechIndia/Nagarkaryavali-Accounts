const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");

const imageToBase64 = (imgPath) => {
  try {
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return "";
  }
};

const generateOutstandingDemandBifurcationPDFHelper = async ({
  reportData = [],
  tableRows = [],
  filters = {},
  metaData = {}
}) => {
  try {
    if (!reportData || reportData.length === 0) {
      throw new Error("No report data provided");
    }

    const templatePath = path.resolve(__dirname, "../../templates/outstanding-demand-bifurcation.html");
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    // Helper function to format currency
    Handlebars.registerHelper('formatCurrency', function(value) {
      if (!value) return '0.00';
      return value;
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

    const reportDataForTemplate = {
      logo,
      corporationName: metaData.corporationName || "Nashik Municipal Corporation",
      rows: tableRows
    };

    const html = template(reportDataForTemplate);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 0 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "15mm", bottom: "15mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `Outstanding_Demand_Bifurcation_${timestamp}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { fileName, outputPath };
  } catch (error) {
    console.error("Outstanding Demand Bifurcation PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  generateOutstandingDemandBifurcationPDFHelper,
};