const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/* ✅ Helper to convert image to base64 */
const imageToBase64 = (imgPath) => {
  try {
    if (!fs.existsSync(imgPath)) {
      console.warn(`⚠️ Image not found at: ${imgPath}`);
      return "";
    }
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return "";
  }
};

const generatePDF = async (html) => {
  // Load Logo from your assets folder
  const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
  const logoBase64 = imageToBase64(logoPath);

  // Inject the logo variable into your HTML template
  const finalHtml = html.replace(/{{LOGO_BASE64}}/g, logoBase64);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setContent(finalHtml, {
    waitUntil: "domcontentloaded",
    timeout: 0,
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "5mm", bottom: "5mm" }
  });

  await browser.close();

  const outputDir = path.resolve(__dirname, "../../../public/pdf");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `notice_${Date.now()}.pdf`;
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, pdfBuffer);

  return {
    fileName,
    url: `http://localhost:5001/pdf/${fileName}`,
    path: outputPath,
  };
};

module.exports = { generatePDF };