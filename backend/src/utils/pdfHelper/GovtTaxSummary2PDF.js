const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "";

const GovtTaxSummary2PDF = async ({
  reportData,
  filters,
  corporationName,
  corporationLogo
}) => {
  try {
    let total = 0;

    const data = reportData.map((r, i) => {
      total += Number(r.TAXAMT || 0);

      return {
        sr: i + 1,
        name: r.TDSNAME,
        amount: formatNumber(r.TAXAMT)
      };
    });

    const templatePath = path.resolve(
      __dirname,
      "../../templates/GovtTaxSummary2.html"
    );

    const template = Handlebars.compile(
      fs.readFileSync(templatePath, "utf8")
    );

    const html = template({
      data,
      total: formatNumber(total),

      // ✅ FIXED (IMPORTANT)
      corporationName,
      corporationLogo,

      filters: {
        fromDate: formatDate(filters.fromDate),
        toDate: formatDate(filters.toDate)
      },

      currentDate: formatDate(new Date()),
      currentTime: new Date().toLocaleTimeString()
    });

    // 🔥 DEBUG (optional)
    // fs.writeFileSync("debug.html", html);

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

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // 🔥 IMPORTANT FIX
    await page.setViewport({ width: 1200, height: 800 });

    await page.setContent(html, {
      waitUntil: "networkidle0"   // ✅ ensures logo loads
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await page.close();
    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Summary_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (err) {
    console.error("PDF ERROR:", err);
    throw err;
  }
};

module.exports = { GovtTaxSummary2PDF };