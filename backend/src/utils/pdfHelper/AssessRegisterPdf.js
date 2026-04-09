const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

//get financial Year
const getFinancialYear = (dateInput= new Date()) => {
  const date = new Date(dateInput);

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JS month is 0-based

  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Convert image to base64
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const generatePdf = async ({ rows, filters, printDate }) => {
  // console.log("rows",filters);
  const templatePath = path.resolve(
    __dirname,
    "../../templates/AssessRegisterPdf.html",
  );
  if (!fs.existsSync(templatePath)) {
    throw new Error("Assessment Register HTML template not found");
  }
  const templateHtml = fs.readFileSync(templatePath, "utf8");

Handlebars.registerHelper("formatDate", function (dateValue) {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (isNaN(d)) return "";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
});
  const template = Handlebars.compile(templateHtml);
    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
      const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";
  // console.log("year",getFinancialYear(printDate))
  const calculateTotals = (rows) => {
  return rows.reduce(
    (acc, r) => {
      acc.area += Number(r.area || 0);
      acc.ratable += Number(r.ratable || 0);
      acc.generaltax += Number(r.generaltax || 0);
      acc.treetax += Number(r.treetax || 0);
      acc.edutax += Number(r.edutax || 0);
      acc.spledutax += Number(r.spledutax || 0);
      acc.firetax += Number(r.firetax || 0);
      acc.malsuvidhalabh += Number(r.malsuvidhalabh || 0);
      acc.emptax += Number(r.emptax || 0);
      acc.illegalfine += Number(r.illegalfine || 0);
      acc.sewrej += Number(r.sewrej || 0);
      acc.roadtax += Number(r.roadtax || 0);
      acc.bigrestax += Number(r.bigrestax || 0);
      acc.totaltax += Number(r.totaltax || 0);
      return acc;
    },
    {
      area: 0,
      ratable: 0,
      generaltax: 0,
      treetax: 0,
      edutax: 0,
      spledutax: 0,
      firetax: 0,
      malsuvidhalabh: 0,
      emptax: 0,
      illegalfine: 0,
      sewrej: 0,
      roadtax: 0,
      bigrestax: 0,
      totaltax: 0,
    }
  );
};
const totals = calculateTotals(rows);

  const html = template({
    corporationName: "Nashik Municipal Corporation",
    rows,
    filters,totals,
    printDate,
    logo, financialYear:getFinancialYear()
  });

    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );
    const browser = await puppeteer.launch({
      headless: true,executablePath:chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4", landscape: true,
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
  });

  await browser.close();

  const outputPath = path.join(
    __dirname,
    "../../../public/pdf",
    `AssessRegisterPdf_${Date.now()}.pdf`,
  );

  fs.writeFileSync(outputPath, pdfBuffer);

  return {
    fileName: path.basename(outputPath),
    outputPath,
  };
};

module.exports=generatePdf;
