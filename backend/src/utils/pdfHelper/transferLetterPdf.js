const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const generateTransferLetterPDF = async (data) => {
  let browser;

  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/transferLetterPdf.html"
    );

    const htmlFile = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlFile);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const html = template(data);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false,
      printBackground: true
    });

    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `TransferLetter_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, pdfBuffer);

    return { fileName, outputPath };

  } catch (err) {
    console.log(err);
    throw err;
  }
};

module.exports = {
  generateTransferLetterPDF
};