const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

/* ✅ Convert local image to base64 */
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const generatePaymentRegisterPDF = async ({
  rows = [],
  fromDate,
  toDate,
  corporationName = "",
  majorCode = "",
  zone = "",
  logo = "", // ✅ dynamic logo
  rptType,
  zoneName = "-"
}) => {
  let browser;

  try {
    /* ================= TEMPLATE ================= */
    const templatePath = path.resolve(
      __dirname,
      "../../templates/payment-register.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    /* ================= LOGO HANDLING ================= */
    let finalLogo = logo;

    // If API didn't send logo → fallback to local file
    if (!finalLogo) {
      const logoPath = path.resolve(
        __dirname,
        "../../assets/NMC_Logo.jpeg"
      );

      finalLogo = fs.existsSync(logoPath)
        ? imageToBase64(logoPath)
        : "";
    }

    /* ================= CHROME ================= */
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const browserOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (fs.existsSync(chromePath)) {
      browserOptions.executablePath = chromePath;
    }

    browser = await puppeteer.launch(browserOptions);

    /* ================= FORMAT DATA ================= */
    let total = 0;

    const formattedRows = rows.map((r) => {
      const amount = Math.abs(Number(r.AMOUNT || 0));
      total += amount;

      return {
        glcode: r.GLCODE,
        accname: r.ACCNAME,
        amountFormatted: amount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        }),
      };
    });

    /* ================= HTML ================= */
    const html = template({
      corporationName,
      logo: finalLogo,
      fromDate,
      toDate,
      majorCode,
      zone,
      rows: formattedRows,
      total: total.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      }),
      currentDate: new Date().toLocaleDateString("en-GB"),
      rptType: rptType === "0" ? "सारांश" : "तपशील",
      zoneName 
    });

    /* ================= GENERATE PDF ================= */
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await browser.close();

    /* ================= SAVE FILE ================= */
    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `PaymentRegister_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (error) {
    if (browser) await browser.close();
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

module.exports = {
  generatePaymentRegisterPDF,
};