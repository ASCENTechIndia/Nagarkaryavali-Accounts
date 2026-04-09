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

const generateSanctionPdf = async ({details,constWise,roomWise}) =>{
 // console.log("data",details,constWise,roomWise)
  const templatePath = path.join(__dirname, "../../templates/sanction-report.html");
  const htmlTemplate = fs.readFileSync(templatePath, "utf8");

Handlebars.registerHelper("inr", value =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
);

Handlebars.registerHelper("formatDate", function (dateValue) {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (isNaN(d)) return "";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
});
  const template = Handlebars.compile(htmlTemplate);
   const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    const totalRoomCount = roomWise.reduce(
  (sum, r) => sum + Number(r.roomcount || 0),
  0
);

const totalRoomArea = roomWise.reduce(
  (sum, r) => sum + Number(r.roomarea || 0),
  0
).toFixed(2);

const totalALV = constWise.reduce(
  (sum, r) => sum + Number(r.yearlyrent || 0),
  0
);

const totalARV = Math.round(totalALV * 0.9); // adjust formula if needed


  const html = template({details:details[0],constWise,roomWise,totalRoomCount,
  totalRoomArea, totalALV,totalARV,
    logo,corporationName: "Nashik Municipal Corporation",});

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
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm" }
  });

  await browser.close();

  const fileName = `SanctionReport_${Date.now()}.pdf`;
  const outputPath = path.join(__dirname, "../../../public/pdf", fileName);
  fs.writeFileSync(outputPath, pdfBuffer);

  return { fileName, outputPath };
};

module.exports = generateSanctionPdf