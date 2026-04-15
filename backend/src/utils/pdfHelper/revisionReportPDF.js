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

const generateRevisionReportPDFHelper = async ({
  details = {},
  constructionWise = [],
  roomWise = [],
  propertyNumber = ""
}) => {
  try {
    if (!details || Object.keys(details).length === 0) {
      throw new Error("No revision report details provided");
    }

    const templatePath = path.resolve(__dirname, "../../templates/revision-report.html");
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    // Register Handlebars helpers
    Handlebars.registerHelper('formatDate', function(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    });

    Handlebars.registerHelper('inr', function(amount) {
      if (!amount && amount !== 0) return '₹ 0';
      return `₹ ${Number(amount).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      })}`;
    });

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    // Extract the actual rows from the response structure
    const detailsData = details.rows && details.rows.length > 0 ? details.rows[0] : details;
    const constructionData = constructionWise.rows || constructionWise;
    const roomData = roomWise.rows || roomWise;

    // Calculate totals
    const totalRoomCount = roomData.reduce((sum, room) => sum + (Number(room.roomcount) || 0), 0);
    const totalRoomArea = roomData.reduce((sum, room) => sum + (Number(room.roomarea) || 0), 0).toFixed(2);
    
    const totalALV = constructionData.reduce((sum, constr) => sum + (Number(constr.yearlyrent) || 0), 0);
    
    // Calculate ARV (you might need to adjust this based on your actual data structure)
    // If ARV is not in the data, you can calculate it or leave it as 0
    const totalARV = constructionData.reduce((sum, constr) => sum + (Number(constr.annualrateablevalue) || Number(constr.yearlyrent) || 0), 0);

    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      executablePath: chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    const browser = await puppeteer.launch(launchOptions);

    const reportDataForTemplate = {
      logo,
      corporationName: "Nashik Municipal Corporation",
      details: detailsData,
      roomWise: roomData,
      constWise: constructionData,
      totalRoomCount,
      totalRoomArea,
      totalALV,
      totalARV,
      generatedOn: new Date(),
      propertyNumber
    };

    // Log the data being passed to template for debugging
    console.log("Template Data:", JSON.stringify(reportDataForTemplate, null, 2));

    const html = template(reportDataForTemplate);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 0 });

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

    const timestamp = Date.now();
    const fileName = `Revision_Report_${propertyNumber}_${timestamp}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { 
      fileName, 
      outputPath,
      pdfUrl: `/pdf/${fileName}`
    };
  } catch (error) {
    console.error("Revision Report PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  generateRevisionReportPDFHelper
};