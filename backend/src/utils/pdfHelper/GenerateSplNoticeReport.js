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

const GenerateSplNoticeReport = async ({
  resultSpecialNoticeDetails,
  resultSpecialNoticeRoomWise,
  resultSpecialNoticeTaxWise,
  printDate,
}) => {
  console.log("specila notice tax wise :", resultSpecialNoticeTaxWise)
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/special-notice-report.html",
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error("Special Notice HTML template not found");
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");

    Handlebars.registerHelper("formatDate", function (dateValue) {
      if (!dateValue) return "";

      const d = new Date(dateValue);
      if (isNaN(d)) return "";

      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();

      return `${dd}/${mm}/${yyyy}`;
    });

    Handlebars.registerHelper("add", function (a, b) {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return (numA + numB).toFixed(2);
    });

    Handlebars.registerHelper("directTotal", function (data) {
      const fields = [
        "cptax",
        "electric",
        "treetax",
        "cleaning",
        "waterbenifittax",
        "watersevrejtax",
        "roadtax",
        "edutax",
        "spledutax",
        "bigrestax",
        "emptax",
      ];

      let total = 0;

      fields.forEach((key) => {
        const val = String(data[key] || "0").replace(/,/g, "");
        total += parseFloat(val) || 0;
      });

      return total.toFixed(2);
    });

    Handlebars.registerHelper("grandTotal", function (data) {
      // removed current taxes
      // const fields = [
      //   "cptax",
      //   "electric",
      //   "treetax",
      //   "cleaning",
      //   "waterbenifittax",
      //   "watersevrejtax",
      //   "roadtax",
      //   "edutax",
      //   "spledutax",
      //   "bigrestax",
      //   "emptax",

      //   "cptax_arr",
      //   "electric_arr",
      //   "treetax_arr",
      //   "cleaning_arr",
      //   "waterbenifittax_arr",
      //   "watersevrejtax_arr",
      //   "roadtax_arr",
      //   "edutax_arr",
      //   "spledutax_arr",
      //   "bigrestax_arr",
      //   "emptax_arr",
      // ];
      const fields = [
        "cptax_arr",
        "electric_arr",
        "treetax_arr",
        "cleaning_arr",
        "waterbenifittax_arr",
        "watersevrejtax_arr",
        "roadtax_arr",
        "edutax_arr",
        "spledutax_arr",
        "bigrestax_arr",
        "emptax_arr",
      ];

      let total = 0;

      fields.forEach((key) => {
        const val = String(data[key] || "0").replace(/,/g, "");
        total += parseFloat(val) || 0;
      });

      return total.toFixed(2);
    });

    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    // console.log("\n🔍 === TEMPLATE DATA DEBUG ===");
    // console.log("resultSpecialNoticeDetails type:", typeof resultSpecialNoticeDetails);
    // console.log("resultSpecialNoticeRoomWise is Array?", Array.isArray(resultSpecialNoticeRoomWise));
    // console.log("resultSpecialNoticeRoomWise length:", resultSpecialNoticeRoomWise?.length || 0);
    // console.log("resultSpecialNoticeTaxWise is Array?", Array.isArray(resultSpecialNoticeTaxWise));
    // console.log("resultSpecialNoticeTaxWise length:", resultSpecialNoticeTaxWise?.length || 0);

    if (
      Array.isArray(resultSpecialNoticeRoomWise) &&
      resultSpecialNoticeRoomWise.length > 0
    ) {
      console.log(
        "First group in resultSpecialNoticeRoomWise:",
        JSON.stringify(resultSpecialNoticeRoomWise[0], null, 2),
      );
    }

    const html = template({
      corporationName: "Nashik Municipal Corporation",
      logo,
      resultSpecialNoticeDetails,
      resultSpecialNoticeRoomWise,
      resultSpecialNoticeTaxWise,
      printDate,
    });

    // console.log("🔍 === HTML GENERATED, LENGTH:", html.length, "===\n");
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe",
    );

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
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

    const fileName = `SplNoticeReport_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();

    fs.writeFileSync(outputPath, finalBytes);

    return { fileName, outputPath };
  } catch (err) {
    console.error("❌ SplNoticeReport PDF generation error:", err);
    throw err;
  }
};

module.exports = GenerateSplNoticeReport;
