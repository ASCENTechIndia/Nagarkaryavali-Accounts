const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");

/* Chunk helper */
const chunkArray = (array = [], size = 1) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/* Image → base64 */
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const generatePropertyDemandPDF = async ({
  property = {},
  taxRows = [],
  transactions = []
}) => {
  let browser;

  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/propertyDemandPdf.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error("Template not found");
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    /* LOGO */
    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    /* Chrome Path */
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      executablePath: chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    };

    if (!fs.existsSync(chromePath)) {
      delete launchOptions.executablePath;
    }

    browser = await puppeteer.launch(launchOptions);

    const finalPdf = await PDFDocument.create();

    const BATCH_SIZE = 1;
    const chunks = chunkArray([property], BATCH_SIZE);

    let pageNumber = 1;
    const totalPages = chunks.length;

    for (const chunk of chunks) {
      const batchData = {
        logo,
        pageNumber,
        totalPages,
        corporationName: "Nashik Municipal Corporation 2025-2026",

        indexNo: property.indexNo,
        ownerName: property.ownerName,
        houseNo: property.houseNo,
        billNo: property.billNo,
        billDate: property.billDate,
        utaraDate: property.utaraDate,
        address: property.address,

        taxRows,
        transactions
      };

      const html = template(batchData);

      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: "domcontentloaded",
        timeout: 0
      });

      /* 🔥 LANDSCAPE ENABLED HERE */
      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,   // ← changed
        printBackground: true,
        margin: { top: "8mm", bottom: "8mm", left: "8mm", right: "8mm" }
      });

      const tempPdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await finalPdf.copyPages(
        tempPdf,
        tempPdf.getPageIndices()
      );

      copiedPages.forEach((p) => finalPdf.addPage(p));

      await page.close();
      pageNumber++;
    }

    await browser.close();

    /* SAVE FILE */
    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `PropertyDemand_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { fileName, outputPath };

  } catch (error) {
    console.error("PDF error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = {
  generatePropertyDemandPDF
};