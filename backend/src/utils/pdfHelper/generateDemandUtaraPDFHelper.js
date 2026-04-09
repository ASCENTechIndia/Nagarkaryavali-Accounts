const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

/* ----------------------------------------------------------
   Safe Image To Base64
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
   Generate Demand Utara PDF
---------------------------------------------------------- */
const generateDemandUtaraPDFHelper = async ({
  property,
  rows,
  metaData = {},
}) => {
  try {
    /* ---------- Validate Input ---------- */
    if (!property) {
      throw new Error("Property data missing");
    }

    if (!rows || !Array.isArray(rows)) {
      throw new Error("Rows data missing or invalid");
    }

    /* ---------- Template Path ---------- */
    const templatePath = path.resolve(
      __dirname,
      "../../templates/DemandUtaraReport.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    /* ---------- Logo ---------- */
    const logoPath = path.resolve(
      __dirname,
      "../../assets/NMC_Logo.jpeg"
    );

    const logo = fs.existsSync(logoPath)
      ? imageToBase64(logoPath)
      : "";

    /* ---------- Prepare HTML ---------- */
    const html = template({
      logo,
      corporationName:
        metaData.corporationName || "Nashik Municipal Corporation",
      financialYear: metaData.financialYear || "2025-2026",
      generatedOn: new Date().toLocaleString("en-IN"),
      generatedBy: metaData.generatedBy || "System",
      property,
      rows,
    });

    console.log("Demand Utara HTML length:", html.length);

    /* ----------------------------------------------------------
       Launch Puppeteer (MATCH YOUR WORKING SERVER SETUP)
    ---------------------------------------------------------- */

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

    /* ---------- IMPORTANT: change waitUntil ---------- */
    await page.setContent(html, {
      waitUntil: "load",   // 🔥 changed from networkidle0
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
    });

    await browser.close();

    /* ---------- Save PDF ---------- */
    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Demand_Utara_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, pdfBuffer);

    console.log("Demand Utara PDF Generated:", fileName);

    return { fileName, outputPath };

  } catch (error) {
    console.error("Demand Utara PDF Error:", error);
    throw error;
  }
};

module.exports = {
  generateDemandUtaraPDFHelper,
};