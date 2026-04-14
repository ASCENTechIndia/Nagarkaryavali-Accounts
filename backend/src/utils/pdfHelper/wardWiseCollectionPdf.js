// const fs = require("fs");
// const path = require("path");
// const puppeteer = require("puppeteer");
// const Handlebars = require("handlebars");
// const { PDFDocument } = require("pdf-lib");

// const imageToBase64 = (imgPath) => {
//   if (!fs.existsSync(imgPath)) return "";
//   const file = fs.readFileSync(imgPath);
//   const ext = path.extname(imgPath).replace(".", "");
//   return `data:image/${ext};base64,${file.toString("base64")}`;
// };

// const generateWardwiseCollectionPDF = async ({
//   records = [],
//   cashTotal = "0",
//   grandTotal = "0",
//   periodText = "",
// }) => {
//   try {
//     const templatePath = path.resolve(
//       __dirname,
//       "../../templates/wardWiseCollectionPdf.html"
//     );

//     if (!fs.existsSync(templatePath)) {
//       throw new Error(`Template not found at: ${templatePath}`);
//     }

//     const templateHtml = fs.readFileSync(templatePath, "utf8");
//     const template = Handlebars.compile(templateHtml);

//     const logoPath = path.resolve(
//       __dirname,
//       "../../assets/NMC_Logo.jpeg"
//     );

//     const html = template({
//       logo: imageToBase64(logoPath),
//       records,
//       cashTotal,
//       grandTotal,
//       periodText,
//     });

//     // Check for Chrome in puppeteer cache - exactly like your reference code
//     const chromePath = path.resolve(
//       __dirname,
//       "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
//     );

//     // Alternative: Also check for common Chrome installation paths
//     const commonChromePaths = [
//       "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//       "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
//       chromePath // Include the puppeteer cache path
//     ];

//     const launchOptions = {
//   headless: true,
//   executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//   args: ["--no-sandbox", "--disable-setuid-sandbox"],
// };

//     // Try to find Chrome in common locations
//     for (const potentialPath of commonChromePaths) {
//       if (fs.existsSync(potentialPath)) {
//         launchOptions.executablePath = potentialPath;
//         console.log(`✅ Found Chrome at: ${potentialPath}`);
//         break;
//       }
//     }

//     // If no Chrome found, log a warning but let puppeteer try its default
//     if (!launchOptions.executablePath) {
//       console.warn("⚠️ Chrome not found in common paths. Puppeteer will use its default behavior.");
//     }

//     const browser = await puppeteer.launch(launchOptions);
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       landscape: true,
//       printBackground: true,
//       margin: {
//         top: "10mm",
//         bottom: "10mm",
//         left: "10mm",
//         right: "10mm",
//       },
//     });

//     await browser.close();

//     const outputDir = path.resolve(
//       __dirname,
//       "../../../public/pdf"
//     );

//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     const fileName = `WardwiseCollection_${Date.now()}.pdf`;
//     const outputPath = path.join(outputDir, fileName);

//     const pdfDoc = await PDFDocument.load(pdfBuffer);
//     const finalBytes = await pdfDoc.save();
//     fs.writeFileSync(outputPath, finalBytes);

//     return { fileName, outputPath };

//   } catch (error) {
//     console.error("❌ Wardwise Collection PDF generation error:", error);
//     throw error;
//   }
// };

// module.exports = {
//   generateWardwiseCollectionPDF,
// };



const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");

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

const generateWardwiseCollectionPDF = async ({
  records = [],
  cashTotal = "0",
  grandTotal = "0",
  periodText = "",
}) => {
  try {
    if (!records || records.length === 0) {
      throw new Error("No records provided");
    }

    const templatePath = path.resolve(
      __dirname,
      "../../templates/wardWiseCollectionPdf.html"
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

    const html = template({
      logo: imageToBase64(logoPath),
      records,
      cashTotal,
      grandTotal,
      periodText,
      currentDate: new Date().toLocaleDateString("en-IN"),
    });

    console.log("Wardwise HTML Generated Length:", html.length);

    /* -----------------------------------------------------
       CHROME DETECTION — SAME AS WORKING HELPER
    ------------------------------------------------------ */

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
      console.log("✅ Using Puppeteer bundled Chrome");
    } else {
      console.log("⚠ Using default Puppeteer Chromium");
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await browser.close();

    /* -----------------------------------------------------
       SAVE FILE
    ------------------------------------------------------ */

    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `WardwiseCollection_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    console.log("✅ Wardwise PDF Generated:", fileName);

    return { fileName, outputPath };

  } catch (error) {
    console.error("❌ Wardwise Collection PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  generateWardwiseCollectionPDF,
};