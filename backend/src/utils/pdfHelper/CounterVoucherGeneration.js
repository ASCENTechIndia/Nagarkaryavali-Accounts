const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// ================= FORMAT =================
const formatAmount = (n) => {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB");
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

// ================= MAIN =================
const CounterVoucherGeneration = async ({
  headerRes,
  header,
  details,
  corporationName,
  corporationLogo,
}) => {
  try {
    if (!header || Object.keys(header).length === 0) {
      throw new Error("Header data missing");
    }
    const templatePath = path.resolve(
      __dirname,
      "../../templates/CounterVoucherGeneration.html",
    );

    const htmlFile = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlFile);

    const now = new Date();

    const rows = headerRes.map((item, index) => ({
      sr: index + 1,

      glcode: item.DRGLCODE || "",
      accname: item.DRACCNO || "",
      narration: item.CRACNAME || "",

      total: formatAmount(item.GROSSAMOUNT || 0),
      deduction: formatAmount(item.AMT || 0),

      paid: formatAmount(item.CRAMT || 0),
      balance: formatAmount(item.BALAMT || 0),
    }));

    const detailRows = details.map((item, index) => ({
      sr: index + 1,

      glcode: item.GLCODE || "",
      accname: item.ACCNO || "",
      narration: item.ACCNAME || "",

      payAmount: formatAmount(item.PAYAMT || item.AMT || 0),
      amount: formatAmount(item.AMOUNT || item.AMT || 0),
    }));

    const totalNet = headerRes.reduce(
      (sum, item) => sum + Number(item.AMT || 0),
      0
    );

    const totalPaid = headerRes.reduce(
      (sum, item) => sum + Number(item.CRAMT || 0),
      0
    );

    const totalBalance = headerRes.reduce(
      (sum, item) => sum + Number(item.BALAMT || 0),
      0
    );

    const totalDeductionAmount = details.reduce(
      (sum, item) =>
        sum + Number(item.AMOUNT || item.AMT || 0),
      0
    );

    const totalNetWithDeduction = totalDeductionAmount + totalPaid;

    // ================= TEMPLATE DATA =================
    const html = template({
      corporationName,
      logo: corporationLogo,

      zone: header.ZONEENAME || "",
      deptname: header.DEPTNAME || "",
      manualno: [...new Set(
        headerRes
          .map((x) => x.MANUALNO)
          .filter(Boolean)
      )].join(","),

      systembillno: [...new Set(
        headerRes
          .map((x) => x.SYSTEMBILLNO)
          .filter(Boolean)
      )].join(","),

      date: now.toLocaleDateString("en-GB"),
      time: now.toLocaleTimeString(),

      refno: header.REFNO || "",
      transno: header.TRANSNO || "",
      transdate: formatDate(header.TRANSDATE),

      // PARTY
      username: header.USERNAME || "",
      partyId: header.PARTYID || "",
      partyname: header.PARTYNAME || "",

      glcode: header.DRGLCODE || "",
      // BANK
      chqno: header.CHQNO || "",
      bankname: header.BANKNAME || "",

      // TEXT
      narration: header.NARRATION || "",

      // TABLES
      rows,
      detailRows,

      // TOTALS
      totalNet: formatAmount(totalNet),
      totalPaid: formatAmount(totalPaid),
      totalBalance: formatAmount(totalBalance),

      totalDeductionAmount: formatAmount(totalDeductionAmount),

      totalNetWithDeduction: formatAmount(
        totalNetWithDeduction
      ),

      // OPTIONAL
      grossamount: formatAmount(header.GROSSAMOUNT),
      amountWords: numberToMarathiWords(totalPaid), 
    });

    // ================= PDF =================
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
      waitUntil: "domcontentloaded",
      timeout: 0
    });

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

    // ================= SAVE =================
    const dir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileName = `CounterVoucher_${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };
  } catch (err) {
    console.error("Counter Voucher PDF Error:", err);
    throw err;
  }
};

module.exports = {
  CounterVoucherGeneration,
};
