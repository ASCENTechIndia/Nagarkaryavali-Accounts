const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

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

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

Handlebars.registerHelper("formatDate", function (date) {
  return formatDate(date);
});

Handlebars.registerHelper("add", function (a, b) {
  return a + b;
});

Handlebars.registerHelper("ifLastPage", function (index, total, options) {
  return index === total - 1 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("formatAmount", function (amount) {
  if (!amount && amount !== 0) return "0";
  return Number(amount).toLocaleString("en-IN");
});

const batchSize = 12;

const batchDataIntoPages = (data, batchSize) => {
  const pages = [];

  if (!data || data.length === 0) {
    return [{ rows: [], pageNumber: 1, totalPages: 1 }];
  }

  for (let i = 0; i < data.length; i += batchSize) {
    pages.push({
      rows: data.slice(i, i + batchSize),
      pageNumber: Math.floor(i / batchSize) + 1,
      totalPages: Math.ceil(data.length / batchSize)
    });
  }

  return pages;
};

const formatChequeData = (data, deptId) => {
  if (!data || !Array.isArray(data)) return [];

  return data.map((row, index) => {
    if (deptId === "7") {
      return {
        slNo: index + 1,
        zone: row.ZONENAME || "",
        propNo: row.PROPNO || "",
        owner: row.OWNERNM || "",
        chequeNo: row.CHEQUENO || "",
        chequeDate: row.CHEQUEDT || "",
        bank: row.BANKNAME || "",
        receiptNo: row.RECNO || "",
        receiptDate: row.RECDATE || "",
        mobile: row.RECMOB || "",
        amount: row.AMOUNT || 0,
        bounceAmount: row.CHEQUEBNCAMT || 0,
        bounceDate: row.CHEQUEBNCDT || "",
        remarks: row.REMARKS || ""
      };
    }

    if (deptId === "21") {
      return {
        slNo: index + 1,
        zone: row.ZONENAME || "",
        propNo: row.PROPNO || "",
        owner: row.OWNERNM || "",
        chequeNo: row.CHEQUENO || "",
        chequeDate: row.CHEQUEDT || "",
        bank: row.BANKNAME || "",
        receiptNo: row.RECNO || "",
        receiptDate: row.RECDATE || "",
        mobile: row.MOBNO || "",
        amount: row.AMOUNT || 0,
        bounceAmount: row.CHEQUEBNCAMT || 0,
        bounceDate: row.CHEQUEBNCDT || "",
        remarks: row.REMARKS || ""
      };
    }

    return {
      slNo: index + 1,
      zone: row.ZONENAME || "",
      propNo: row.PROPNO || "",
      owner: row.OWNERNM || "",
      chequeNo: row.CHEQUENO || "",
      chequeDate: row.CHEQUEDT || "",
      bank: row.BANKNAME || "",
      receiptNo: row.RECNO || "",
      receiptDate: row.RECDATE || "",
      mobile: row.MOBNO || row.RECMOB || "",
      amount: row.AMOUNT || 0,
      bounceAmount: row.CHEQUEBNCAMT || 0,
      bounceDate: row.CHEQUEBNCDT || "",
      remarks: row.REMARKS || ""
    };
  });
};

const RptChequeDishonourPDFHelper = async ({
  data,
  deptId,
  fromDate,
  toDate,
  corp
}) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/RptChequeDishonour.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    const formattedRows = formatChequeData(data, deptId);

    const pages = batchDataIntoPages(formattedRows, batchSize);

    const totalAmount = formattedRows.reduce(
      (sum, row) => sum + (parseFloat(row.amount) || 0),
      0
    );

    const totalBounce = formattedRows.reduce(
      (sum, row) => sum + (parseFloat(row.bounceAmount) || 0),
      0
    );

    const headerText = `${fromDate} ते ${toDate}`;

    const html = template({
      pages,
      corporationName: corp?.ABC_MUNICIPAL_TEXT || "",
      headerText,
      logo: corp?.ULBLOGO,
      totalAmount,
      totalBounce
    });

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

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 0
    });

    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `ChequeDishonour_${timestamp}.pdf`;
    const filePath = path.join(outputDir, fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: false,
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "10px",
        right: "10px"
      }
    });

    await page.close();
    await browser.close();

    return {
      fileName,
      filePath
    };
  } catch (err) {
    console.error("Cheque Dishonour PDF Error:", err);
    throw err;
  }
};

module.exports = { RptChequeDishonourPDFHelper };