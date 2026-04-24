const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// ================= NUMBER FORMAT =================
const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

  return getWords(Math.floor(num)).trim() + " रुपये";

  if (!num || num === 0) return "शून्य रुपये";

  return getWords(Math.floor(num)).trim() + " रुपये";
};

const VoucherPreparreprint = async ({ data }) => {
  try {
    if (!data || !data.length) {
      throw new Error("No data for PDF");
    }

    const templatePath = path.resolve(__dirname, "../../templates/VoucherPreparreprint.html");

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const main = data[0];

    // ✅ MULTILINE DETAILS + AMOUNTS
    const details = data.map((r, i) => `${i + 1}. ${r.CRACNAME}`).join("<br>");

    const amounts = data.map((r) => formatNumber(r.CRAMT)).join("<br>");

    const totalDeduction = data.reduce((sum, r) => sum + Number(r.CRAMT || 0), 0);

    const netAmount = Number(main.AMT) - totalDeduction;

    const items = [
      {
        sr: 1,
        code: main.DRACCNO,
        name: main.DRACNAME,
        total: formatNumber(main.AMT),
        details,
        amount: amounts,
        net: formatNumber(netAmount),
      },
    ];

    const currentDate = new Date();

    const html = template({
      corporationName: "अहिल्यानगर महानगरपालिका, अहिल्यानगर",

      partyId: main.PARTYID,
      partyName: main.PARTYNAME,
      pan: main.PANCARD,
      narration: main.NARRATION,

      date: currentDate.toLocaleDateString("en-GB"),
      time: currentDate.toLocaleTimeString(),

      voucherNo: main.REFNO,
      voucherDate: new Date(main.TRANSDATE).toLocaleDateString("en-GB"),

      zone: main.ZONEENAME,
      department: main.DEPTNAME,
      username: main.USERNAME,

      items,

      grandTotal: formatNumber(main.AMT),
      totalDeduction: formatNumber(totalDeduction),
      netTotal: formatNumber(netAmount),

      amountInWords: numberToMarathiWords(netAmount),
    });

    // ================= PUPPETEER =================
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // ================= SAVE =================
    const outputDir = path.resolve("public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `FrmVoucherPreparreprint_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };
  } catch (err) {
    console.error("PDF ERROR:", err);
    throw err;
  }
};

module.exports = { VoucherPreparreprint };
