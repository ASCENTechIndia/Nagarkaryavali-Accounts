const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const imageToBase64 = (imgPath) => {
  if (!imgPath || !fs.existsSync(imgPath)) return "";
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

Handlebars.registerHelper("formatNumber", function (value) {
  if (value === undefined || value === null || value === "") return "0.00";
  const num = Number(value);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

Handlebars.registerHelper("inc", function (value) {
  return parseInt(value) + 1;
});


const generateAccountDetailsPDFHelper = async ({
  rows = [],
  corporationName = "",
  logo = "",
}) => {
  let browser;

  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/FrmAccountDetails.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    let finalLogo = logo;
    if (!finalLogo) {
      const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
      if (fs.existsSync(logoPath)) {
        finalLogo = imageToBase64(logoPath);
      }
    }

    const totalBudget = rows.reduce(
      (s, r) => s + Number(r.BUDGETAMT || 0),
      0
    );
    const totalOpening = rows.reduce(
      (s, r) => s + Number(r.OPENINGBAL || 0),
      0
    );
    const totalRevised = rows.reduce(
      (s, r) => s + Number(r.REVBUDGETAMT || 0),
      0
    );

    const templateData = {
      corporationName: corporationName || "",
      corporationLogo: finalLogo,
      rows: rows.map((r, idx) => ({
        srNo: idx + 1,
        functionCode: r.FUNCTIONCODE || "",
        objectCode: r.OBJECTCODE || "",
        accountName: r.VAR_ACCMASTER_ACCNAME || "",
        oldAccNo: r.OLDACCNO || "",
        budgetAmt: Number(r.BUDGETAMT || 0),
        openingBal: Number(r.OPENINGBAL || 0),
        revBudgetAmt: Number(r.REVBUDGETAMT || 0),
      })),
      totalBudget,
      totalOpening,
      totalRevised,
    };

    const html = template(templateData);

    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );
    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };
    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "8mm", bottom: "8mm", left: "8mm", right: "8mm" },
      preferCSSPageSize: true,
    });

    await browser.close();
    browser = null;

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Account_Details_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };
  } catch (error) {
    if (browser) await browser.close();
    console.error("Account Details PDF Generation Error:", error);
    throw error;
  }
};

module.exports = { generateAccountDetailsPDFHelper };