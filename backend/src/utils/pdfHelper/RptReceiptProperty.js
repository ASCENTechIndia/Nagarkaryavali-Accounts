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

const RptReceiptPropertyPDFHelper = async ({ reportData, filters, corporationName, corporationLogo }) => {
  try {
    if (!reportData.length) throw new Error("No data");

    console.log("reportData", reportData);

    const templatePath = path.resolve(__dirname, "../../templates/ReceiptProperty.html");
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logo = corporationLogo
      ? `data:image/png;base64,${corporationLogo}`
      : imageToBase64(path.resolve(__dirname, "../../assets/logo.png"));

    // 🔹 1. Group by ledger code (ACCNO or GLCODE)
    const grouped = new Map();
    reportData.forEach((row) => {
      const code = String(row.ACCNO || row.GLCODE || "");
      const amt = Number(row.AMOUNT || row.amount || 0);
      grouped.set(code, (grouped.get(code) || 0) + amt);
    });

    const getAmt = (code) => grouped.get(code) || 0;

    // 🔹 2. Map template rows to ledger codes
    const amount1  = getAmt("91111110001"); // सामान्य कर
    const amount2  = getAmt("91015210001"); // पाणीपट्टी
    const amount3  = getAmt("31615210002"); // पाणी पुरवठा लाभ कर
    const amount4  = getAmt("91011400003"); // साफसफाई
    const amount5  = getAmt("91011900001"); // मलप्रवाह सुविधा लाभ कर
    const amount6  = getAmt("81111400003"); // अग्निशमन कर
    const amount7  = getAmt("94713310002"); // मनपा शिक्षण उपकर
    const amount8  = getAmt("97111710002"); // रस्ताकर

    const amount9  = getAmt("34011190001"); // घनकचरा व्यवस्था (रहिवास)
    const amount10 = getAmt("34011190002"); // घनकचरा व्यवस्था (अरहिवास)

    // रिबेट
    // const rebateAmount = Number(reportData[0]?.DISCOUNT_91028290001 || 0);
    // const discountAmount = Number(reportData[0]?.DISCOUNT_91028290003 || 0);

    const rebateAmount = Math.max(
      ...reportData.map(row => Number(row.DISCOUNT_91028290001 || 0))
    );

    const discountAmount = Math.max(
      ...reportData.map(row => Number(row.DISCOUNT_91028290003 || 0))
    );

    const amount12 = getAmt("91015210004"); // विशेष पाणीपट्टी
    const amount13 = getAmt("94311400002"); // विशेष साफसफाई कर
    const amount14 = getAmt("94811400002"); // वृक्षकर
    const amount15 = getAmt("98138110002"); // महाराष्ट्र शिक्षण कर
    const amount16 = getAmt("98238120002"); // रोजगार हमी कर
    const amount17 = getAmt("91047500001"); // प्रोजेक्शन शुल्क
    const amount18 = getAmt("91915890002"); // शास्ती

    // Row 19
    const amount19 = discountAmount; // रिबेट/शास्ती सुट

    // 🔹 3. Totals
    const total1to10 =
      amount1 +
      amount2 +
      amount3 +
      amount4 +
      amount5 +
      amount6 +
      amount7 +
      amount8 +
      amount9 +
      amount10;

    // रिबेट वजा जाता
    const totalAfterRebate = total1to10 - rebateAmount;

    // 12 ते 19
    const total11to19 =
      amount12 +
      amount13 +
      amount14 +
      amount15 +
      amount16 +
      amount17 +
      amount18 -
      amount19;

    // 1 ते 19
    const grandTotal = totalAfterRebate + total11to19;
    const totalDiscount = rebateAmount + discountAmount;

    // घरपट्टी एकुण (1-10 + 12-18)
    const propertyTaxTotal =
      total1to10 +
      amount12 +
      amount13 +
      amount14 +
      amount15 +
      amount16 +
      amount17 +
      amount18;

    // अंतिम वसूल रक्कम
    const netAmount = propertyTaxTotal - totalDiscount;


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

      amount12: formatNumber(amount12),
      amount13: formatNumber(amount13),
      amount14: formatNumber(amount14),
      amount15: formatNumber(amount15),
      amount16: formatNumber(amount16),
      amount17: formatNumber(amount17),
      amount18: formatNumber(amount18),
      amount19: formatNumber(amount19),

      total1to10: formatNumber(total1to10),
      total7to8: formatNumber(totalAfterRebate), // template variable name retained
      total9to18: formatNumber(total11to19),     // template variable name retained

      grandTotal: formatNumber(grandTotal),

      totalWithoutDiscount: formatNumber(propertyTaxTotal),
      totalWithDiscount: formatNumber(netAmount),

      amountInWords: numberToMarathiWords(netAmount),
      rebateAmount,
      discountAmount,
      totalDiscount
    });


    // Puppeteer PDF generation (unchanged)
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
  RptReceiptPropertyPDFHelper
};
