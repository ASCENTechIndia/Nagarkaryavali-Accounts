
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

/**
 * Convert image to base64
 */
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

/**
 * Generate Summary Receipt Report PDF
 */
const generateSummaryReportPDF = async ({
  details,
  grandTotal,
  userWise,
  recdate,
  printDate,
  corporationName,
  username
}) => {

  try {

    const templatePath = path.join(
      __dirname,
      "../../templates/SummaryReceiptReport.html"
    );

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // Format Date Helper
    Handlebars.registerHelper("formatDate", function (date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("en-GB");
    });

    // Format Currency Helper
    Handlebars.registerHelper("inr", function (value) {
      return Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    });

    const template = Handlebars.compile(htmlTemplate);

    // Logo
    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    // Add serial numbers manually
    const mappedDetails = details.map((item, index) => ({
      ...item,
      srNo: index + 1
    }));

    const html = template({
      details: mappedDetails,
      grandTotal,
      userWise,
      recdate: new Date(recdate).toLocaleDateString("en-GB"),
      printDate,
      corporationName,
      logo,
      username
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "8mm",
        right: "8mm"
      }
    });

    await browser.close();

    const fileName = `SummaryReceiptReport_${Date.now()}.pdf`;
    const outputPath = path.join(
      __dirname,
      "../../../public/pdf",
      fileName
    );

    fs.writeFileSync(outputPath, pdfBuffer);

    return {
      fileName,
      outputPath
    };

  } catch (error) {
    console.error("❌ Summary PDF Generation Error:", error);
    throw error;
  }
};

module.exports = {
  generateSummaryReportPDF
};
