const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const numberToWords = require("number-to-words");

// ================= FORMAT =================
const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB");
};

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

const generateReceiptPDF = async ({ data, corporationName, corporationLogo }) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/Receipt.html");

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    const logo = imageToBase64(corporationLogo);

    let total = 0;

    const rows = data.map((row, i) => {
      total += Number(row.AMOUNT || 0);

      return {
        sr: i + 1,
        accno: row.ACCCNO,
        accname: row.ACCNAME,
        // Ensure party is empty string if null to match visual design
        party: row.PARTYNAME || "",
        partycode: row.PARTYCODE || "",
        // Formatted to 2 decimal places with commas
        amount: Number(row.AMOUNT).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        taxac: row.TAXAC,
        taxname: row.TAXNAME,
        remarks : row.REMARKS
      };
    });

    const amountWords = numberToWords.toWords(total).toUpperCase() + " RUPEES ONLY";
    const html = template({
      rows,
      total: total.toFixed(2),
      amountWords,
      refno: data[0].REFNO,
      date: formatDate(data[0].TRANSDATE),
      trnstype: data[0].TRANSTYPE,
      zone: data[0].ZONEENAME,
      logo,
      corporationName,
    });

    // const browser = await puppeteer.launch({
    //   headless: true,
    //   args: ["--no-sandbox"],
    // });

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

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const fileName = `Receipt_${Date.now()}.pdf`;
    const filePath = path.resolve("public/pdf", fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "10px",
        bottom: "10px",
        left: "10px",
        right: "10px",
      },
    });

    await browser.close();

    return { fileName, filePath };
  } catch (err) {
    console.error("PDF ERROR:", err);
    throw err;
  }
};

module.exports = { generateReceiptPDF };
