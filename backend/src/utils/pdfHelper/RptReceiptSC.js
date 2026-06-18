const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const imageToBase64 = (imgPath) => {
  try {
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-GB");
};

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN");
};

// Convert number to words (basic utility)
const numberToWords = (num) => {
  const formatter = new Intl.NumberFormat("en-IN", { style: "decimal" });
  return formatter.format(num); // replace with full words if needed
};

const numberToMarathiWords = (num) => {
  const units = [
    "",
    "एक",
    "दोन",
    "तीन",
    "चार",
    "पाच",
    "सहा",
    "सात",
    "आठ",
    "नऊ",
    "दहा",
    "अकरा",
    "बारा",
    "तेरा",
    "चौदा",
    "पंधरा",
    "सोळा",
    "सतरा",
    "अठरा",
    "एकोणीस",
    "वीस",
    "एकवीस",
    "बावीस",
    "तेवीस",
    "चोवीस",
    "पंचवीस",
    "सव्वीस",
    "सत्तावीस",
    "अठ्ठावीस",
    "एकोणतीस",
    "तीस",
    "एकतीस",
    "बत्तीस",
    "तेहेतीस",
    "चौतीस",
    "पस्तीस",
    "छत्तीस",
    "सदतीस",
    "अडतीस",
    "एकोणचाळीस",
    "चाळीस",
    "एकेचाळीस",
    "बेचाळीस",
    "त्रेचाळीस",
    "चव्वेचाळीस",
    "पंचेचाळीस",
    "सेहेचाळीस",
    "सत्तेचाळीस",
    "अठ्ठेचाळीस",
    "एकोणपन्नास",
    "पन्नास",
    "एकावन्न",
    "बावन्न",
    "त्रेपन्न",
    "चोपन्न",
    "पंचावन्न",
    "छप्पन्न",
    "सत्तावन्न",
    "अठ्ठावन्न",
    "एकोणसाठ",
    "साठ",
    "एकसष्ट",
    "बासष्ट",
    "त्रेसष्ट",
    "चौसष्ट",
    "पासष्ट",
    "सहासष्ट",
    "सत्तेसष्ट",
    "अडुसष्ट",
    "एकोणसत्तर",
    "सत्तर",
    "एकाहत्तर",
    "बहात्तर",
    "त्र्याहत्तर",
    "चौर्‍याहत्तर",
    "पंच्याहत्तर",
    "शहात्तर",
    "सत्त्याहत्तर",
    "अठ्ठ्याहत्तर",
    "एकोणऐंशी",
    "ऐंशी",
    "एक्याऐंशी",
    "ब्याऐंशी",
    "त्र्याऐंशी",
    "चौर्‍याऐंशी",
    "पंच्याऐंशी",
    "शहाऐंशी",
    "सत्त्याऐंशी",
    "अठ्ठ्याऐंशी",
    "एकोणनव्वद",
    "नव्वद",
    "एक्याण्णव",
    "ब्याण्णव",
    "त्र्याण्णव",
    "चौर्‍याण्णव",
    "पंच्याण्णव",
    "शहाण्णव",
    "सत्त्याण्णव",
    "अठ्ठ्याण्णव",
    "नव्व्याण्णव",
    "शंभर",
  ];
  const getWords = (n) => {
    if (n === 0) return "";
    if (n <= 100) return units[n];

    if (n < 1000) {
      return units[Math.floor(n / 100)] + "शे " + getWords(n % 100);
    }

    if (n < 100000) {
      return getWords(Math.floor(n / 1000)) + " हजार " + getWords(n % 1000);
    }

    if (n < 10000000) {
      return getWords(Math.floor(n / 100000)) + " लाख " + getWords(n % 100000);
    }

    return getWords(Math.floor(n / 10000000)) + " कोटी " + getWords(n % 10000000);
  };

  if (!num || num === 0) return "शून्य रुपये";

  return getWords(Math.floor(num)) + " रुपये";

  if (!num || num === 0) return "शून्य रुपये";

  return getWords(Math.floor(num)) + " रुपये";
};

const RptReceiptSCPDFHelper = async ({ reportData, filters, corporationName, corporationLogo }) => {
  try {
    if (!reportData.length) throw new Error("No data");

    console.log("reportData", reportData);

    const templatePath = path.resolve(__dirname, "../../templates/ReceiptSC.html");
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logo = corporationLogo
      ? `data:image/png;base64,${corporationLogo}`
      : imageToBase64(path.resolve(__dirname, "../../assets/logo.png"));

    const grouped = new Map();
    reportData.forEach((row) => {
      const code = String(row.ACCNO || row.GLCODE || "");
      const amt = Number(row.AMOUNT || row.amount || 0);
      grouped.set(code, (grouped.get(code) || 0) + amt);
    });

    const getAmt = (code) => grouped.get(code) || 0;

    const amount1  = getAmt("31615210001"); 
    const amount2  = getAmt("91015720001"); 
    const amount3  = getAmt("45015620001"); 
    const amount4  = getAmt("91015890001"); 
    const amount5  = getAmt("91015200001"); 
    const amount6  = getAmt("21015890001"); 
    const amount7  = getAmt("91015710001"); 
    const amount8  = getAmt("31615440001"); 

    const amount9  = getAmt("31615440002");
    const amount10 = getAmt("31015450001"); 

    const amount11 = getAmt("32019900001"); 
    const amount12 = getAmt("91037190001"); 
    const amount13 = getAmt("91037190002"); 

    const total2to6 =
      amount2 +
      amount3 +
      amount4 +
      amount5 +
      amount6;

    const total7to12 =
      amount7 + 
      amount8 + 
      amount9 + 
      amount10 + 
      amount11 +
      amount12;

    const grandTotal = amount1 + total2to6 + total7to12 + amount13;

    console.log("amount11", amount11);

    const html = template({
      corporationLogo: logo,
      corporationLogo,
      corporationName,
      reportDate: formatDate(new Date()),
      fromDate: formatDate(filters.fromDate),
      toDate: formatDate(filters.toDate),

      amount1: formatNumber(amount1),
      amount2: formatNumber(amount2),
      amount3: formatNumber(amount3),
      amount4: formatNumber(amount4),
      amount5: formatNumber(amount5),
      amount6: formatNumber(amount6),
      amount7: formatNumber(amount7),
      amount8: formatNumber(amount8),
      amount9: formatNumber(amount9),
      amount10: formatNumber(amount10),
      amount11: formatNumber(amount11),
      amount12: formatNumber(amount12),
      amount13: formatNumber(amount13),

      total2to6: formatNumber(total2to6),
      total7to12: formatNumber(total7to12),    

      grandTotal: formatNumber(grandTotal),
      amountInWords: numberToMarathiWords(grandTotal),
    });


    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );
    const launchOptions = { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] };
    if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await page.close();
    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `Receipt_Register_UserWise_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (error) {
    console.error("UserWise PDF Error:", error);
    throw error;
  }
};

module.exports = {
  RptReceiptSCPDFHelper
};
