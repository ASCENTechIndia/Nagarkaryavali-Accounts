const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const numberToWords = require("number-to-words");

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "");

const imageToBase64 = (imgPath) => {
  try {
    if (!imgPath) return "";
    if (imgPath.startsWith("data:image")) return imgPath;

    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};

// Handlebars.registerHelper("formatChequeNo", (num) => {
//   return String(num || "").padStart(6, "");
// });

Handlebars.registerHelper("formatChequeNo", (num) => {
  if (num === null || num === undefined || num === "") {
    return "";
  }

  return String(num).padStart(6, "0");
});

const generatePaymentPDF = async ({ data, corporationName, corporationLogo }) => {
  const templatePath = path.resolve(__dirname, "../../templates/payment.html");

  const htmlTemplate = fs.readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(htmlTemplate);
  const logo = imageToBase64(corporationLogo);
  let total = 0;

  const rows = data.map((r, i) => {
    total += Number(r.AMT || 0);

    return {
      sr: i + 1,
      accno: r.PACNO,
      
      accname: r.PCACCNAME,
      partycode: r.PARTYCODE,
      party: r.PARTYNAME,
      amount: Number(r.AMT).toFixed(2),
    };
  });

  const amountWords = numberToWords.toWords(total).toUpperCase() + " RUPEES ONLY";

  const html = template({
    rows,
    total: total.toFixed(2),
    data: data[0],
    date: formatDate(data[0].TRANSDATE),
    time: new Date().toLocaleTimeString(),
    logo,
    corporationName,
    amountWords,
  });

  //   const browser = await puppeteer.launch({
  //     headless: true,
  //     args: ["--no-sandbox"],
  //   });

  const chromePath = path.resolve(__dirname, "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe");

  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  if (fs.existsSync(chromePath)) {
    launchOptions.executablePath = chromePath;
  }

  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const fileName = `Payment_${Date.now()}.pdf`;
  const filePath = path.resolve("public/pdf", fileName);

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
    margin: { top: "10px", bottom: "10px", left: "10px", right: "10px" },
  });

  await browser.close();

  return { fileName, filePath };
};

module.exports = { generatePaymentPDF };
