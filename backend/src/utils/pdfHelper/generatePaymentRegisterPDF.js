const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

/* ✅ REUSE IMAGE FUNCTION */
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const generatePaymentRegisterPDF = async ({
  rows = [],
  fromDate,
  toDate,
  corporationName = "अहिल्यानगर महानगरपालिका, अहिल्यानगर",
  majorCode = "",
  zone = ""
}) => {
  let browser;

  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/payment-register.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    /* ✅ LOGO */
    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    /* ✅ CHROME */
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      executablePath: fs.existsSync(chromePath)
        ? chromePath
        : undefined,
      args: ["--no-sandbox"],
    };

    browser = await puppeteer.launch(launchOptions);

    /* ✅ FORMAT DATA */
    let total = 0;

    const formattedRows = rows.map((r) => {
      const amt = Math.abs(Number(r.AMOUNT || 0));
      total += amt;

      return {
        glcode: r.GLCODE,
        accname: r.ACCNAME,
        amountFormatted: amt.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        }),
      };
    });

    const html = template({
      corporationName,
      logo,
      fromDate,
      toDate,
      majorCode,
      zone,
      rows: formattedRows,
      total: total.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      }),
      currentDate: new Date().toLocaleDateString("en-GB"),
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

    const fileName = `PaymentRegister_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (err) {
    if (browser) await browser.close();
    throw err;
  }
};

module.exports = {
  generatePaymentRegisterPDF,
};