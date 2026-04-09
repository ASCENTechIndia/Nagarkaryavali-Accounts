

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

/* ----------------------------------------------------------
   Safe Convert Image To Base64
---------------------------------------------------------- */
const imageToBase64 = (imgPath) => {
  try {
    if (!fs.existsSync(imgPath)) return "";
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch (error) {
    console.error("Image conversion error:", error);
    return "";
  }
};

/* ----------------------------------------------------------
   Generate Double Entry PDF
---------------------------------------------------------- */
const generateOutstandingCollectionBifurcationPDFHelper = async ({
  reportData = [],
  tableRows = [],
  filters = {},
  metaData = {},
}) => {
  try {
    if (!reportData || reportData.length === 0) {
      throw new Error("No report data provided");
    }

    const templatePath = path.resolve(
      __dirname,
      "../../templates/DoubleEntryReport3.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(
      __dirname,
      "../../assets/NMC_Logo.jpeg"
    );

    const logo = imageToBase64(logoPath);

    const html = template({
      logo,
      corporationName:
        metaData.corporationName || "Nashik Municipal Corporation",
      generatedOn: new Date().toLocaleString("en-IN"),
      fromDate: filters.fromDate || "",
      toDate: filters.toDate || "",
      rows: tableRows || [],
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

    await page.setContent(html, { waitUntil: "load" , timeout: 60000});

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await browser.close();

    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Double_Entry_Report_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    // ✅ WRITE DIRECTLY (NO pdf-lib)
    fs.writeFileSync(outputPath, pdfBuffer);

    return { fileName, outputPath };

  } catch (error) {
    console.error("Double Entry PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  generateOutstandingCollectionBifurcationPDFHelper,
};