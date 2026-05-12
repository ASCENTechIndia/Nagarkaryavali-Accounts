const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const imageToBase64 = (imgPath) => {
  try {

    const file = fs.readFileSync(imgPath);

    const ext = path.extname(imgPath)
      .replace(".", "");

    return `data:image/${ext};base64,${file.toString("base64")}`;

  } catch {

    return "";
  }
};

const formatDate = (date) => {

  if (!date) return "";

  return new Date(date).toLocaleDateString(
    "en-GB"
  );
};

const formatNumber = (num) => {

  return Number(num || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
};

Handlebars.registerHelper("inc", function (value) {
  return parseInt(value) + 1;
});

const numberToMarathiWords = (num) => {

  return `${formatNumber(num)} रुपये`;
};

const FrmChequeDepositPDFHelper = async ({
  rows,
  ulbInfo,
}) => {

  try {

    const templatePath = path.resolve(
      __dirname,
      "../../templates/FrmChequeDeposit.html"
    );

    const templateHtml =
      fs.readFileSync(templatePath, "utf8");

    const template =
      Handlebars.compile(templateHtml);

    const logoPath = path.resolve(
      __dirname,
      "../../assets/logo.png"
    );

    const logo = imageToBase64(logoPath);

    const firstRow = rows[0] || {};

    const totalAmount = rows.reduce(
      (sum, row) =>
        sum + Number(row.AMOUNT || 0),
      0
    );

    const formattedRows = rows.map((row) => ({
      ...row,

      AMOUNT: formatNumber(row.AMOUNT),

      CHEQDT: formatDate(row.CHEQDT),
    }));

    const html = template({

      logo: ulbInfo.ULBLOGO || logo,

      corporationName:
        ulbInfo?.ABC_MUNICIPAL_TEXT,

      slipDate:
        formatDate(firstRow.TRANSDATE),

      printTime:
        new Date().toLocaleTimeString(
          "en-IN"
        ),

      bankName:
        firstRow.BANKNAME || "",

      branchName:
        firstRow.BRANCHNAME || "",

      panNo:
        firstRow.PANNO || "",

      slipNo:
        firstRow.PAVTINNO || "",

      accountType:
        firstRow.ACTYPE || "",

      accountNo:
        firstRow.ACCNO || "",

      ward:
        firstRow.ZONEID || "",

      rows: formattedRows,

      totalAmount:
        formatNumber(totalAmount),

      amountInWords:
        numberToMarathiWords(totalAmount),
    });

    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath =
        chromePath;
    }

    const browser =
      await puppeteer.launch(
        launchOptions
      );

    const page =
      await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    const pdfBuffer =
      await page.pdf({
        format: "A4",
        printBackground: true,
      });

    await page.close();

    await browser.close();

    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf"
    );

    if (!fs.existsSync(outputDir)) {

      fs.mkdirSync(outputDir, {
        recursive: true,
      });
    }

    const fileName =
      `Cheque_Deposit_${Date.now()}.pdf`;

    const filePath =
      path.join(outputDir, fileName);

    fs.writeFileSync(
      filePath,
      pdfBuffer
    );

    return {
      fileName,
      filePath,
    };

  } catch (error) {

    console.error(
      "Cheque Deposit PDF Error:",
      error
    );

    throw error;
  }
};

module.exports = {
  FrmChequeDepositPDFHelper,
};