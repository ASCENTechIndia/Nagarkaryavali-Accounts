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

const generateReceiptPDF = async ({ data, corporationName, corporationLogo, transNo, userId }) => {
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
        taxac: row.TAXACCCNO,
        taxname: row.TAXNAME,
        remarks: row.REMARKS
      };
    });

    const discount = Number(data?.[0]?.DISCOUNTAMOUNT || 0);
    const netTotal = total - discount;

    const amountWords = numberToMarathiWords(netTotal);

    const currentTimestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const html = template({
      rows,
      total: total.toFixed(2),
      discount,
      netTotal,
      amountWords,
      refno: data[0].REFNO,
      date: formatDate(data[0].TRANSDATE),
      trnstype: data[0].TRANSTYPE,
      zone: data[0].ZONEENAME,
      deptname: data[0].DEPTNAME,
      logo,
      corporationName,
      transNo,
      userId,
      currentTimestamp
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
