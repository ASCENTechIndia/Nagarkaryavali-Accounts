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

module.exports = async function generateMeasurePDF({propNo,flatDetails,usageDetails,printDate}) {
  // console.log("data",flatDetails)
  const templatePath = path.resolve(
    __dirname,
    "../../templates/printMeasurement.html"
  );
   if (!fs.existsSync(templatePath)) {
      throw new Error("Measurement HTML template not found");
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
  Handlebars.registerHelper("add", function (a, b) {
  return (Number(a) || 0) + (Number(b) || 0);
});

  const template = Handlebars.compile(templateHtml);
 const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

//to display flat measurment table
    const groupByFloor = (flatDetails) => {
  const map = {};

  flatDetails.forEach(row => {
    if (!map[row.floorid]) {
      map[row.floorid] = {
        floor_name: row.floor_name,
        rows: []
      };
    }
    map[row.floorid].rows.push(row);
  });

  return Object.values(map).map(floor => ({
    floor_name: floor.floor_name,
    rowspan: floor.rows.length,
    rows: floor.rows
  }));
};

const measurementFloors = groupByFloor(flatDetails);
//to display usage table 
const usageTotal = usageDetails.reduce(
  (acc, u) => {
    acc.yearlyrent += Number(u.yearlyrent || 0);
    acc.legal_rv += Number(u.legal_rv || 0);
    acc.illigal_rv += Number(u.illigal_rv || 0);
    return acc;
  },
  { yearlyrent: 0, legal_rv: 0, illigal_rv: 0 }
);

usageTotal.taxableValue = usageTotal.legal_rv + usageTotal.illigal_rv;

//to display summary details
const summary = {
  totalConstruction: 0,
  legalConstruction: 0,
  illegalConstruction: 0,
  totalRV: 0,
  legalRV: 0,
  illegalRV: 0
};

// RV values (from usageDetails)
usageDetails.forEach(u => {
  summary.legalRV += Number(u.legal_rv || 0);
  summary.illegalRV += Number(u.illigal_rv || 0);
  // Construction 
   summary.legalConstruction += Number(u.legal_area ||0);
  summary.illegalConstruction += Number(u.illigal_area || 0); 
});

summary.totalRV = summary.legalRV + summary.illegalRV;
summary.totalConstruction= summary.legalConstruction + summary.illegalConstruction;

//to pass data in html
  const html = template({propNo,
    flatDetails,measurementFloors,
    usageDetails,usageTotal,
    printDate,summary,
    logo,
    corporationName: "Nashik Municipal Corporation"
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

  const fileName = `Measurement_${Date.now()}.pdf`;
  const outputPath = path.join(outputDir, fileName);

  const finalPdf = await PDFDocument.load(pdfBuffer);
  fs.writeFileSync(outputPath, await finalPdf.save());

  return { fileName, outputPath };
};
