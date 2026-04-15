const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const generateMonthlyTaxwisePDF = async ({
  reportData,
  fromDate,
  toDate,
  printDate,
  corporationName,
}) => {

  const templatePath = path.join(
    __dirname,
    "../../templates/MonthlyTaxwiseReport.html"
  );

  const htmlTemplate = fs.readFileSync(templatePath, "utf8");

  Handlebars.registerHelper("inr", value =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );

  const template = Handlebars.compile(htmlTemplate);

  const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
  const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

  const mapped = reportData.map((row, index) => ({
    ...row,
    srNo: index + 1,
  }));

  const html = template({
    reportData: mapped,
    fromDate,
    toDate,
    printDate,
    corporationName,
    logo,
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
    margin: { top: "10mm", bottom: "10mm" },
  });

  await browser.close();

  const fileName = `MonthlyTaxwiseReport_${Date.now()}.pdf`;
  const outputPath = path.join(__dirname, "../../../public/pdf", fileName);

  fs.writeFileSync(outputPath, pdfBuffer);

  return { fileName, outputPath };
};

module.exports = { generateMonthlyTaxwisePDF };